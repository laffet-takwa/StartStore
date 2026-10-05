/**
 * Authentication.
 *
 * **Supabase Auth is the source of truth.** The browser signs in against Supabase
 * directly, and the access token Supabase returns is what Django validates on
 * every protected request (see `services/api.ts` for the interceptor). Django
 * then mirrors the Supabase user into `public.profiles` on first contact - it
 * never stores a password.
 *
 * A secondary path exists for environments without a browser Supabase client:
 * `POST /api/auth/login/`, where Django asks Supabase to verify the password and
 * returns a StartStore-issued pair. It is kept working because the backend already
 * supports it, and it gives refresh-token rotation.
 */

import { get, patch, post } from './api'
import { getSupabaseClient } from '@/lib/supabase'
import type { LoginResponse, LogoutPayload, Profile, ProfileUpdate } from '@/types'
import { tokenStorage } from '@/utils/storage'

export interface RegisterPayload {
  email: string
  password: string
  full_name?: string
  phone?: string
}

export const authService = {
  /**
   * Register through Supabase, then make Django create the profile.
   *
   * The profile row is created as a side effect of the first authenticated
   * request, and always defaults to `role = customer` - a client can never choose
   * its own role.
   */
  async registerWithSupabase(payload: RegisterPayload): Promise<Profile> {
    const supabase = requireSupabase()

    const { data, error } = await supabase.auth.signUp({
      email: payload.email,
      password: payload.password,
      options: {
        data: {
          // Lands in auth.users.user_metadata, which the Django sync reads.
          full_name: payload.full_name,
          phone: payload.phone,
        },
      },
    })

    if (error) throw new Error(normaliseSupabaseError(error.message))

    // Email confirmation may be required, in which case there is no session yet.
    if (!data.session) {
      throw new Error(
        'Check your inbox to confirm your email address, then sign in.',
      )
    }

    tokenStorage.setTokens(data.session.access_token, data.session.refresh_token)

    // Touching /me/ is what makes Django upsert the profile row.
    const profile = await authService.me()

    // Belt and braces: make sure the submitted details landed even if the project
    // has user_metadata disabled.
    const patchPayload: ProfileUpdate = {}
    if (payload.full_name && !profile.full_name) patchPayload.full_name = payload.full_name
    if (payload.phone && !profile.phone) patchPayload.phone = payload.phone

    return Object.keys(patchPayload).length ? authService.updateProfile(patchPayload) : profile
  },

  /** Sign in with Supabase and mirror the resulting session into local storage. */
  async loginWithSupabase(email: string, password: string): Promise<Profile> {
    const supabase = requireSupabase()

    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error || !data.session) {
      // Never disclose whether the address exists.
      throw new Error(normaliseSupabaseError(error?.message ?? 'Incorrect email or password.'))
    }

    tokenStorage.setTokens(data.session.access_token, data.session.refresh_token)
    return authService.me()
  },

  /** Sign out of Supabase and clear every local trace of the session. */
  async logoutSupabase(supabaseAccessToken?: string): Promise<void> {
    const supabase = getSupabaseClient()
    try {
      // Best effort server-side revocation first, so the refresh token dies too.
      if (supabaseAccessToken) {
        await post('/auth/logout/', { supabase_access_token: supabaseAccessToken }).catch(
          () => undefined,
        )
      }
      await supabase?.auth.signOut()
    } finally {
      tokenStorage.clear()
    }
  },

  /** Send the current Supabase access token so Django can revoke the session. */
  async currentSupabaseAccessToken(): Promise<string | undefined> {
    const supabase = getSupabaseClient()
    if (!supabase) return undefined
    const { data } = await supabase.auth.getSession()
    return data.session?.access_token ?? undefined
  },

  /* --- Django-issued alternative ------------------------------------------ */

  async login(email: string, password: string): Promise<LoginResponse> {
    const data = await post<LoginResponse>('/auth/login/', { email, password })
    tokenStorage.setTokens(data.access, data.refresh)
    tokenStorage.setProfile(data.user)
    return data
  },

  async register(payload: RegisterPayload): Promise<Profile> {
    const profile = await post<Profile>('/auth/register/', payload)
    tokenStorage.setProfile(profile)
    return profile
  },

  /**
   * Revoke tokens. Errors are swallowed deliberately: a user clicking "log out"
   * should always end up logged out.
   */
  async logout(payload: LogoutPayload = {}): Promise<void> {
    try {
      await post<void>('/auth/logout/', payload)
    } catch {
      /* best effort - the local session is cleared regardless */
    } finally {
      tokenStorage.clear()
    }
  },

  /** The current profile. Also re-syncs it into local storage. */
  async me(): Promise<Profile> {
    const profile = await get<Profile>('/auth/me/')
    tokenStorage.setProfile(profile)
    return profile
  },

  async updateProfile(payload: ProfileUpdate): Promise<Profile> {
    const profile = await patch<Profile>('/auth/me/', payload)
    tokenStorage.setProfile(profile)
    return profile
  },

  clearSession(): void {
    tokenStorage.clear()
  },
}

function requireSupabase() {
  const supabase = getSupabaseClient()
  if (!supabase) {
    throw new Error(
      'Sign-in is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.',
    )
  }
  return supabase
}

/** Map Supabase's auth error strings onto messages worth showing a shopper. */
function normaliseSupabaseError(message: string): string {
  const text = message.toLowerCase()
  if (text.includes('invalid login credentials')) return 'Incorrect email or password.'
  if (text.includes('email not confirmed')) {
    return 'Check your inbox to confirm your email address, then sign in.'
  }
  if (text.includes('user already registered')) {
    return 'An account with this email already exists.'
  }
  if (text.includes('password should be')) return 'Choose a stronger password.'
  if (text.includes('rate limit') || text.includes('too many')) {
    return 'Too many attempts. Please wait a moment and try again.'
  }
  return message
}

export type AuthService = typeof authService
