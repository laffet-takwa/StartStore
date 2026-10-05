import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { ApiError } from '@/services/api'
import { cartService } from '@/services/cart.service'
import { useCartBadgeStore, useCartUiStore } from '@/store/cartStore'
import { useAuthStore } from '@/store/authStore'
import { toast } from '@/store/uiStore'
import { ROUTES } from '@/utils/constants'
import { queryKeys } from '@/lib/queryClient'

/**
 * The cart is scoped to a signed-in profile, so the query is disabled for guests
 * rather than firing a request that would 401.
 */
export function useCart() {
  const isAuthenticated = useAuthStore((state) => state.status === 'authenticated')

  const query = useQuery({
    queryKey: queryKeys.cart,
    queryFn: cartService.get,
    enabled: isAuthenticated,
    staleTime: 15_000,
  })

  const setCount = useCartBadgeStore((state) => state.setCount)
  const count = query.data?.total_items ?? 0
  const badgeCount = useCartBadgeStore((state) => state.count)

  // Mirror the count into the badge store so the navbar does not have to
  // subscribe to the whole cart object on every page.
  if (isAuthenticated && badgeCount !== count) {
    setCount(count)
  }

  return {
    ...query,
    cart: query.data ?? null,
    items: query.data?.items ?? [],
    count,
    isEmpty: isAuthenticated && query.isSuccess && (query.data?.items.length ?? 0) === 0,
  }
}

export function useCartMutations() {
  const queryClient = useQueryClient()
  const noteAdded = useCartUiStore((state) => state.noteAdded)
  const openDrawer = useCartUiStore((state) => state.openDrawer)

  /** Any cart change invalidates the cart, its items and the product stock view. */
  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: queryKeys.cart })
    void queryClient.invalidateQueries({ queryKey: queryKeys.cartItems })
    void queryClient.invalidateQueries({ queryKey: ['products'] })
  }

  const addMutation = useMutation({
    mutationFn: (input: { product_id: string; quantity: number }) =>
      cartService.addItem(input),
    onSuccess: (_item, variables) => {
      invalidate()
      noteAdded(variables.product_id)
      toast.success('Added to your bag', 'Ready when you are.', {
        label: 'View bag',
        href: ROUTES.cart,
      })
    },
    onError: (error) => {
      toast.error('Could not add to bag', messageOf(error))
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ itemId, quantity }: { itemId: string; quantity: number }) =>
      cartService.updateItem(itemId, quantity),
    onSuccess: () => invalidate(),
    onError: (error) => toast.error('Could not update quantity', messageOf(error)),
  })

  const removeMutation = useMutation({
    mutationFn: (itemId: string) => cartService.removeItem(itemId),
    onSuccess: () => {
      invalidate()
      toast.success('Removed from bag')
    },
    onError: (error) => toast.error('Could not remove item', messageOf(error)),
  })

  const clearMutation = useMutation({
    mutationFn: () => cartService.clear(),
    onSuccess: () => {
      invalidate()
      toast.success('Bag emptied')
    },
    onError: (error) => toast.error('Could not empty bag', messageOf(error)),
  })

  return {
    addItem: addMutation.mutateAsync,
    addPending: addMutation.isPending,
    updateItem: updateMutation.mutateAsync,
    updatePending: updateMutation.isPending,
    removeItem: removeMutation.mutateAsync,
    removePending: removeMutation.isPending,
    clearCart: clearMutation.mutateAsync,
    clearPending: clearMutation.isPending,
    openDrawer,
  }
}

/** Shared error-message extraction so every mutation reports the same way. */
export function messageOf(error: unknown, fallback = 'Something went wrong.'): string {
  if (error instanceof ApiError) return error.message
  if (error instanceof Error) return error.message
  return fallback
}
