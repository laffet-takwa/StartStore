/**
 * Session state.
 *
 * Supabase owns the session; this store mirrors it so React can render without
 * touching the SDK on every render. Tokens are also written to
 * `utils/storage` because the Axios interceptors need them without importing
 * React state (which would be a cycle).
 */

import { create } from 'zustand'

import { getSupabaseClient } from '@/lib/supabase'
import { authService } from '@/services/auth.service'
import type { Profile, ProfileUpdate } from '@/types'
import { sessionEvents, tokenStorage } from '@/utils/storage'

export type AuthStatus = 'unknown' | 'authenticated' | 'anonymous'

interface AuthState {
  user: Profile | null
  status: AuthStatus
  /** Restore the session from Supabase (or the local token store) on boot. */
  hydrate: () => Promise<void>
  /** Supabase-first sign-in. */
  login: (email: string, password: string) => Promise<Profile>
  /** Supabase-first registration, then profile creation. */
  register: (payload: {
    email: string
    password: string
    full_name?: string
    phone?: string
  }) => Promise<Profile>
  logout: () => Promise<void>
  updateProfile: (payload: ProfileUpdate) => Promise<Profile>
  setUser: (user: Profile | null) => void
  /** Re-read the profile after the session changes. */
  refreshProfile: () => Promise<Profile | null>
  endSession: () => void
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: tokenStorage.getProfile(),
  status: tokenStorage.getAccess() ? 'authenticated' : 'anonymous',

  hydrate: async () => {
    // A Supabase session is authoritative when the client is configured.
    const supabase = getSupabaseClient()
    if (supabase) {
      const { data } = await supabase.auth.getSession()
      const accessToken = data.session?.access_token
      if (!accessToken) {
        tokenStorage.clear()
        set({ user: null, status: 'anonymous' })
        return
      }
      tokenStorage.setTokens(accessToken, data.session?.refresh_token ?? null)
    } else if (!tokenStorage.getAccess()) {
      set({ user: null, status: 'anonymous' })
      return
    }

    try {
      // Asking Django for /me/ both proves the token works and materialises the
      // profile row on first contact.
      const user = await authService.me()
      set({ user, status: 'authenticated' })
    } catch {
      authService.clearSession()
      set({ user: null, status: 'anonymous' })
    }
  },

  login: async (email, password) => {
    const user = await authService.loginWithSupabase(email, password)
    set({ user, status: 'authenticated' })
    return user
  },

  register: async (payload) => {
    const user = await authService.registerWithSupabase(payload)
    set({ user, status: 'authenticated' })
    return user
  },

  logout: async () => {
    const supabaseToken = await authService.currentSupabaseAccessToken()
    await authService.logoutSupabase(supabaseToken)
    set({ user: null, status: 'anonymous' })
  },

  updateProfile: async (payload) => {
    const user = await authService.updateProfile(payload)
    set({ user })
    return user
  },

  refreshProfile: async () => {
    if (get().status !== 'authenticated') return null
    try {
      const user = await authService.me()
      set({ user })
      return user
    } catch {
      return null
    }
  },

  setUser: (user) => set({ user, status: user ? 'authenticated' : 'anonymous' }),

  endSession: () => {
    if (get().status === 'anonymous') return
    authService.clearSession()
    void getSupabaseClient()?.auth.signOut({ scope: 'local' }).catch(() => undefined)
    set({ user: null, status: 'anonymous' })
  },
}))

/** Subscribe once at app start: an exhausted refresh token ends the session. */
export function bindSessionExpiry(): () => void {
  return sessionEvents.subscribe(() => useAuthStore.getState().endSession())
}

/* --- Selectors ------------------------------------------------------------- */

export const selectUser = (state: AuthState): Profile | null => state.user
export const selectIsAuthenticated = (state: AuthState): boolean => state.status === 'authenticated'
export const selectIsAdmin = (state: AuthState): boolean => state.user?.role === 'admin'
export const selectDisplayName = (state: AuthState): string =>
  state.user?.full_name?.trim() || state.user?.email || ''
