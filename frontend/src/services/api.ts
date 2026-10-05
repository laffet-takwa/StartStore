/**
 * The single place HTTP happens.
 *
 * Responsibilities:
 *  - inject the bearer token on every request,
 *  - refresh an expired access token exactly once (single-flight, so a burst of
 *    401s produces one refresh call rather than one per request),
 *  - translate the backend's `{ error: { code, message, details } }` envelope into
 *    a typed `ApiError` that components can switch on.
 *
 * Components never import axios; they go through the service modules.
 */

import axios, {
  type AxiosError,
  type AxiosInstance,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios'

import type { ErrorBody } from '@/types'
import { getSupabaseClient } from '@/lib/supabase'
import { API_URL } from '@/utils/env'
import { sessionEvents, tokenStorage } from '@/utils/storage'

/** Normalised error every service rejects with. */
export class ApiError extends Error {
  readonly status: number
  readonly code: string
  readonly details?: ErrorBody['details']

  constructor(message: string, status: number, code: string, details?: ErrorBody['details']) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.details = details
  }

  /** Field-keyed messages, for rendering straight into a form. */
  get fieldErrors(): Record<string, string[]> {
    if (!this.details || Array.isArray(this.details) || typeof this.details !== 'object') return {}
    const out: Record<string, string[]> = {}
    for (const [key, value] of Object.entries(this.details)) {
      if (Array.isArray(value)) out[key] = value.map(String)
      else if (typeof value === 'string') out[key] = [value]
      else if (value && typeof value === 'object') {
        // Nested serializer errors: { shipping_address: { city: ['...'] } }
        for (const [nested, nestedValue] of Object.entries(value as Record<string, unknown>)) {
          if (Array.isArray(nestedValue)) out[nested] = nestedValue.map(String)
          else if (typeof nestedValue === 'string') out[nested] = [nestedValue]
        }
      }
    }
    return out
  }

  get isUnauthorized(): boolean {
    return this.status === 401
  }

  get isForbidden(): boolean {
    return this.status === 403
  }

  get isNotFound(): boolean {
    return this.status === 404
  }

  /** True when the request never reached the API. */
  get isNetwork(): boolean {
    return this.status === 0
  }
}

interface RetryableConfig extends InternalAxiosRequestConfig {
  _retried?: boolean
}

export const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 20000,
  headers: { Accept: 'application/json' },
})

/** Bare client for the refresh call itself, so it cannot recurse. */
const refreshClient = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: { Accept: 'application/json' },
})

const REFRESH_PATH = '/auth/refresh/'
const LOGIN_PATH = '/auth/login/'

/* -------------------------------------------------------------------------- */
/* Token acquisition                                                             */
/* -------------------------------------------------------------------------- */

/**
 * Resolve the bearer token for an outgoing request.
 *
 * Supabase Auth is the source of truth, so its session wins when present. The
 * local token store is the fallback for the alternative StartStore-issued pair
 * (see `auth.service.ts`) and keeps this synchronous on the fast path.
 */
async function resolveAccessToken(): Promise<string | null> {
  const stored = tokenStorage.getAccess()
  if (stored) return stored

  const supabase = getSupabaseClient()
  if (!supabase) return null

  const { data } = await supabase.auth.getSession()
  return data.session?.access_token ?? null
}

api.interceptors.request.use(async (config) => {
  // A caller may have supplied its own header (tests, the refresh call).
  if (config.headers.has('Authorization')) return config

  try {
    const token = await resolveAccessToken()
    if (token) {
      config.headers.set('Authorization', `Bearer ${token}`)
    }
  } catch {
    // A Supabase outage must not block the request; Django will answer 401.
  }
  return config
})

/* -------------------------------------------------------------------------- */
/* Response                                                                     */
/* -------------------------------------------------------------------------- */

let inFlightRefresh: Promise<string | null> | null = null

/**
 * Refresh the access token once, whichever session is in play.
 *
 * With Supabase Auth that means `refreshSession()`; otherwise it is the
 * StartStore refresh token. Concurrent 401s share one call via the memoised
 * promise, and `_retried` on the config guarantees a request is replayed at most
 * once - so no refresh loop is possible.
 */
async function refreshAccessToken(): Promise<string | null> {
  const supabase = getSupabaseClient()
  if (supabase) {
    const { data, error } = await supabase.auth.refreshSession()
    if (!error && data.session?.access_token) {
      // Mirror into the local store so the fast path stays warm.
      tokenStorage.setTokens(data.session.access_token, data.session.refresh_token ?? null)
      return data.session.access_token
    }
    if (!error) return null
  }

  const refresh = tokenStorage.getRefresh()
  if (!refresh) return null

  try {
    const { data } = await refreshClient.post<{ access?: string; refresh?: string }>(
      REFRESH_PATH,
      { refresh },
    )
    if (!data?.access) return null
    tokenStorage.setTokens(data.access, data.refresh ?? null)
    return data.access
  } catch {
    return null
  }
}

function endSession(): void {
  tokenStorage.clear()
  void getSupabaseClient()?.auth.signOut({ scope: 'local' }).catch(() => undefined)
  sessionEvents.emitExpired()
}

api.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    const config = error.config as RetryableConfig | undefined
    const status = error.response?.status ?? 0

    const isExpiredAccess =
      status === 401 &&
      Boolean(config) &&
      !config?._retried &&
      // Never try to refresh on the auth calls themselves; that is a loop.
      !config?.url?.includes('/auth/refresh/') &&
      !config?.url?.includes(LOGIN_PATH)

    if (isExpiredAccess && config) {
      config._retried = true
      inFlightRefresh ??= refreshAccessToken().finally(() => {
        inFlightRefresh = null
      })
      const access = await inFlightRefresh

      if (access) {
        config.headers.set('Authorization', `Bearer ${access}`)
        return api.request(config)
      }
      endSession()
    }

    return Promise.reject(normaliseError(error))
  },
)

/** Turn any axios failure into a predictable `ApiError`. */
export function normaliseError(error: unknown): ApiError {
  if (error instanceof ApiError) return error

  if (axios.isAxiosError(error)) {
    const status = error.response?.status ?? 0
    const body = error.response?.data as { error?: ErrorBody } | undefined

    if (!error.response) {
      return new ApiError(
        status === 0
          ? 'Could not reach the store. Check your connection and try again.'
          : error.message || 'Something went wrong.',
        status,
        'network_error',
      )
    }

    if (body?.error) {
      return new ApiError(body.error.message || 'Request failed.', status, body.error.code, body.error.details)
    }

    // Defensive: a non-DRF error page (proxy 502, HTML body, …).
    return new ApiError(defaultMessageFor(status), status, `http_${status}`)
  }

  if (error instanceof Error) {
    return new ApiError(error.message, 0, 'unknown_error')
  }

  return new ApiError('Something went wrong.', 0, 'unknown_error')
}

function defaultMessageFor(status: number): string {
  switch (status) {
    case 400:
      return 'That request was not valid.'
    case 401:
      return 'Your session has expired. Please sign in again.'
    case 403:
      return 'You do not have permission to do that.'
    case 404:
      return 'We could not find what you were looking for.'
    case 409:
      return 'That conflicts with the current state.'
    case 429:
      return 'Too many requests. Please slow down and try again.'
    default:
      return status >= 500
        ? 'The store is having trouble. Please try again shortly.'
        : 'Something went wrong.'
  }
}

/* -------------------------------------------------------------------------- */
/* Helpers used by the service modules                                          */
/* -------------------------------------------------------------------------- */

/** Any object of query parameters; interfaces are accepted via `object`. */
export type QueryParams = object

export async function get<T>(url: string, params?: QueryParams): Promise<T> {
  const { data } = await api.get<T>(url, { params: cleanParams(params) })
  return data
}

export async function post<T>(url: string, body?: unknown, config?: AxiosRequestConfigLike): Promise<T> {
  const { data } = await api.post<T>(url, body, config)
  return data
}

export async function patch<T>(url: string, body?: unknown): Promise<T> {
  const { data } = await api.patch<T>(url, body)
  return data
}

export async function put<T>(url: string, body?: unknown): Promise<T> {
  const { data } = await api.put<T>(url, body)
  return data
}

export async function del<T>(url: string): Promise<T> {
  const { data } = await api.delete<T>(url)
  return data
}

/** Multipart create, used for image uploads. */
export async function postForm<T>(url: string, form: FormData): Promise<T> {
  const { data } = await api.post<T>(url, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data
}

/** Multipart update, used when replacing a product image. */
export async function patchForm<T>(url: string, form: FormData): Promise<T> {
  const { data } = await api.patch<T>(url, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data
}

type AxiosRequestConfigLike = { headers?: Record<string, string> }

/**
 * Drop `undefined`/`null`/`''` so the backend never sees empty query params.
 * Booleans are stringified because Django's filters parse them from strings.
 */
export function cleanParams(
  params?: QueryParams,
): Record<string, string | number | boolean> | undefined {
  if (!params) return undefined
  const out: Record<string, string | number | boolean> = {}
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue
    if (typeof value === 'boolean') out[key] = value
    else if (typeof value === 'number') {
      if (!Number.isNaN(value)) out[key] = value
    } else out[key] = String(value)
  }
  return Object.keys(out).length ? out : undefined
}

export { endSession }
