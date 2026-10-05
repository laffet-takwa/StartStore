import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'

import { messageOf } from '@/hooks/useCart'
import { wishlistService } from '@/services/wishlist.service'
import { useAuthStore } from '@/store/authStore'
import { useWishlistStore } from '@/store/wishlistStore'
import { toast } from '@/store/uiStore'
import { queryKeys } from '@/lib/queryClient'

export function useWishlist() {
  const isAuthenticated = useAuthStore((state) => state.status === 'authenticated')

  const query = useQuery({
    queryKey: queryKeys.wishlist,
    queryFn: wishlistService.list,
    enabled: isAuthenticated,
    staleTime: 30_000,
  })

  const sync = useWishlistStore((state) => state.sync)
  const ids = query.data?.results?.map((entry) => entry.product_id) ?? []

  // Keep the mirrored id set aligned with the server so product cards can render
  // the filled heart without each one running its own query.
  useEffect(() => {
    if (query.isSuccess) sync(ids, query.data?.count ?? ids.length)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query.isSuccess, query.data])

  return {
    ...query,
    entries: query.data?.results ?? [],
    count: query.data?.count ?? 0,
    ids: useWishlistStore((state) => state.ids),
  }
}

export function useWishlistToggle() {
  const queryClient = useQueryClient()
  const ids = useWishlistStore((state) => state.ids)
  const add = useWishlistStore((state) => state.add)
  const remove = useWishlistStore((state) => state.remove)
  const isAuthenticated = useAuthStore((state) => state.status === 'authenticated')

  const mutation = useMutation({
    mutationFn: (productId: string) => wishlistService.toggle(productId),
    // Optimistic: flip the heart immediately, reconcile from the response.
    onMutate: async (productId: string) => {
      const wasSaved = ids.has(productId)
      if (wasSaved) remove(productId)
      else add(productId)
      return { wasSaved }
    },
    onError: (error, productId, context) => {
      if (context?.wasSaved) add(productId)
      else remove(productId)
      if (!isAuthenticated) {
        toast.error('Sign in to save items', 'Your saved list lives with your account.')
      } else {
        toast.error('Could not update wishlist', messageOf(error))
      }
    },
    onSuccess: (result) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.wishlist })
      toast.info(
        result.in_wishlist ? 'Saved to wishlist' : 'Removed from wishlist',
        undefined,
      )
    },
  })

  return {
    toggle: mutation.mutate,
    isPending: mutation.isPending,
    isSaved: (productId: string) => ids.has(productId),
  }
}

export function useRemoveFromWishlist() {
  const queryClient = useQueryClient()
  const remove = useWishlistStore((state) => state.remove)

  return useMutation({
    mutationFn: (productId: string) => wishlistService.remove(productId),
    onMutate: (productId: string) => remove(productId),
    onError: (error) => toast.error('Could not remove item', messageOf(error)),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.wishlist })
      toast.success('Removed from wishlist')
    },
  })
}
