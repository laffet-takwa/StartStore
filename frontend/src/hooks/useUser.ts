import { useQuery } from '@tanstack/react-query'

import { addressService } from '@/services/address.service'
import { userService } from '@/services/user.service'
import type { Address } from '@/types'
import { queryKeys } from '@/lib/queryClient'

export function useProfile() {
  return useQuery({
    queryKey: queryKeys.profile,
    queryFn: userService.me,
    staleTime: 60_000,
  })
}

export function useAddresses(params?: { is_default?: boolean }) {
  return useQuery({
    queryKey: [...queryKeys.addresses, params ?? {}],
    queryFn: () => addressService.list(params),
    staleTime: 30_000,
  })
}

/** The default address, or the most recently saved one as a sensible fallback. */
export function useDefaultAddress(): Address | null {
  const { data, isLoading } = useAddresses()
  if (isLoading) return null
  const entries = data?.results ?? []
  return entries.find((entry) => entry.is_default) ?? entries[0] ?? null
}
