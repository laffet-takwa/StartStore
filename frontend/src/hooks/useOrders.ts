import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { messageOf } from '@/hooks/useCart'
import { adminOrderService, orderService } from '@/services/order.service'
import type { CheckoutPayload, OrderQuery } from '@/types'
import { toast } from '@/store/uiStore'
import { queryKeys } from '@/lib/queryClient'

export function useOrders(query?: OrderQuery) {
  return useQuery({
    queryKey: queryKeys.orders(query),
    queryFn: () => orderService.list(query),
    staleTime: 15_000,
  })
}

export function useOrder(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.order(id ?? ''),
    queryFn: () => orderService.get(id as string),
    enabled: Boolean(id),
    staleTime: 15_000,
  })
}

export function useCheckout() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CheckoutPayload) => orderService.checkout(payload),
    onSuccess: () => {
      // Checkout empties the cart and moves stock, so several caches are stale.
      void queryClient.invalidateQueries({ queryKey: queryKeys.cart })
      void queryClient.invalidateQueries({ queryKey: ['products'] })
      void queryClient.invalidateQueries({ queryKey: ['orders'] })
    },
  })
}

export function useCancelOrder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (orderId: string) => orderService.cancel(orderId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['orders'] })
      void queryClient.invalidateQueries({ queryKey: ['products'] })
      toast.success('Order cancelled', 'Stock has been returned to the store.')
    },
    onError: (error) => toast.error('Could not cancel order', messageOf(error)),
  })
}

/* --- Admin ---------------------------------------------------------------- */

export function useAdminOrders(query?: OrderQuery & { user?: string }) {
  return useQuery({
    queryKey: queryKeys.adminOrders(query),
    queryFn: () => adminOrderService.list(query),
    staleTime: 15_000,
  })
}

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, ...payload }: { id: string } & Parameters<typeof adminOrderService.updateStatus>[1]) =>
      adminOrderService.updateStatus(id, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'orders'] })
      void queryClient.invalidateQueries({ queryKey: ['orders'] })
      void queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] })
      toast.success('Order updated')
    },
    onError: (error) => toast.error('Could not update order', messageOf(error)),
  })
}

export function useAdminCancelOrder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (orderId: string) => adminOrderService.cancel(orderId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'orders'] })
      void queryClient.invalidateQueries({ queryKey: ['orders'] })
      void queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] })
      toast.success('Order cancelled', 'Reserved stock has been released.')
    },
    onError: (error) => toast.error('Could not cancel order', messageOf(error)),
  })
}
