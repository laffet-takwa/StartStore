import { useCallback } from 'react'

import { messageOf } from '@/hooks/useCart'
import { useAuthStore } from '@/store/authStore'

/** Session state and the actions that change it. */
export function useAuth() {
  const user = useAuthStore((state) => state.user)
  const status = useAuthStore((state) => state.status)
  const hydrate = useAuthStore((state) => state.hydrate)
  const login = useAuthStore((state) => state.login)
  const register = useAuthStore((state) => state.register)
  const logout = useAuthStore((state) => state.logout)
  const updateProfile = useAuthStore((state) => state.updateProfile)

  return {
    user,
    status,
    isAuthenticated: status === 'authenticated',
    isAdmin: user?.role === 'admin',
    displayName: user?.full_name?.trim() || user?.email || '',
    hydrate,
    login,
    register,
    logout,
    updateProfile,
    /**
     * `unknown` means the stored session has not been checked yet. Guards wait
     * on this so a reload never flashes the signed-out UI.
     */
    isResolving: status === 'unknown',
  }
}

/**
 * Run an async action, swallowing the error after reporting it.
 * Lets callers write `await run(() => action())` without try/catch noise while
 * still failing loudly into a toast.
 */
export function useSafeAction<TArgs extends unknown[], TResult>(
  action: (...args: TArgs) => Promise<TResult>,
  onError?: (message: string) => void,
) {
  return useCallback(
    async (...args: TArgs): Promise<TResult | undefined> => {
      try {
        return await action(...args)
      } catch (error) {
        onError?.(messageOf(error))
        return undefined
      }
    },
    [action, onError],
  )
}
