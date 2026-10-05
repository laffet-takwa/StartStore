import { del, get, patch, post } from './api'
import type { Cart, CartItem, CartItemInput } from '@/types'

export const cartService = {
  /** Returns the cart, creating an empty one server-side on first call. */
  get: () => get<Cart>('/cart/'),

  items: () => get<{ count: number; results: CartItem[] }>('/cart/items/'),

  /** Adds a product, or tops up the existing line for it. */
  addItem: (payload: CartItemInput) => post<CartItem>('/cart/items/', payload),

  updateItem: (itemId: string, quantity: number) =>
    patch<CartItem>(`/cart/items/${itemId}/`, { quantity }),

  removeItem: (itemId: string) => del<void>(`/cart/items/${itemId}/`),

  /** Empties the whole cart. */
  clear: () => del<Cart>('/cart/'),
}

export type CartService = typeof cartService
