/**
 * Token storage.
 *
 * Kept out of the Zustand store on purpose: the Axios interceptors need the
 * access token without importing React state, which would create a cycle.
 */

import type { Profile } from '@/types'

const ACCESS_KEY = 'startstore.access'
const REFRESH_KEY = 'startstore.refresh'
const PROFILE_KEY = 'startstore.profile'

function safeGet(key: string): string | null {
  try {
    return window.localStorage.getItem(key)
  } catch {
    // Private browsing / disabled storage: fall back to an in-memory session.
    return memory[key] ?? null
  }
}

function safeSet(key: string, value: string | null): void {
  memory[key] = value
  try {
    if (value === null) window.localStorage.removeItem(key)
    else window.localStorage.setItem(key, value)
  } catch {
    /* non-fatal */
  }
}

const memory: Record<string, string | null> = {}

export const tokenStorage = {
  getAccess: () => safeGet(ACCESS_KEY),
  getRefresh: () => safeGet(REFRESH_KEY),
  getProfile(): Profile | null {
    const raw = safeGet(PROFILE_KEY)
    if (!raw) return null
    try {
      return JSON.parse(raw) as Profile
    } catch {
      return null
    }
  },
  setTokens(access: string, refresh?: string | null): void {
    safeSet(ACCESS_KEY, access)
    if (refresh) safeSet(REFRESH_KEY, refresh)
  },
  setRefresh(refresh: string): void {
    safeSet(REFRESH_KEY, refresh)
  },
  setProfile(profile: Profile | null): void {
    if (!profile) {
      safeSet(PROFILE_KEY, null)
      return
    }
    safeSet(PROFILE_KEY, JSON.stringify(profile))
  },
  clear(): void {
    safeSet(ACCESS_KEY, null)
    safeSet(REFRESH_KEY, null)
    safeSet(PROFILE_KEY, null)
  },
}

/* -------------------------------------------------------------------------- */
/* Session-expiry signal                                                       */
/* -------------------------------------------------------------------------- */

type Listener = () => void

const listeners = new Set<Listener>()

/**
 * Notified when the refresh token is exhausted and the session has to end.
 * Guards and the navbar subscribe to this to react without polling.
 */
export const sessionEvents = {
  subscribe(listener: Listener): () => void {
    listeners.add(listener)
    return () => listeners.delete(listener)
  },
  emitExpired(): void {
    listeners.forEach((listener) => listener())
  },
}
