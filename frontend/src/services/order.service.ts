import { get, patch, post } from './api'
import type {
  CheckoutPayload,
  Order,
  OrderListItem,
  OrderQuery,
  OrderStatusUpdate,
  Paginated,
} from '@/types'

export const orderService = {
  /** Checkout. Send either a saved `address_id` or an inline address. */
  checkout: (payload: CheckoutPayload) => post<Order>('/orders/', payload),

  list: (query?: OrderQuery) => get<Paginated<OrderListItem>>('/orders/', query),

  get: (id: string) => get<Order>(`/orders/${id}/`),

  /** Allowed while the order is pending, confirmed or processing. */
  cancel: (id: string) => post<Order>(`/orders/${id}/cancel/`),
}

export const adminOrderService = {
  list: (query?: OrderQuery & { user?: string }) =>
    get<Paginated<Order>>('/admin/orders/', query),

  get: (id: string) => get<Order>(`/admin/orders/${id}/`),

  /** Moves the order along the fulfilment state machine. */
  updateStatus: (id: string, payload: OrderStatusUpdate) =>
    patch<Order>(`/admin/orders/${id}/status/`, payload),

  cancel: (id: string) => post<Order>(`/admin/orders/${id}/cancel/`),
}

export type OrderService = typeof orderService
export type AdminOrderService = typeof adminOrderService
