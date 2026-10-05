import { del, get, post } from './api'
import type { Paginated, WishlistEntry, WishlistToggleResult } from '@/types'

export const wishlistService = {
  list: () => get<Paginated<WishlistEntry>>('/wishlist/'),

  /**
   * Idempotent toggle. Returns the resulting state and the new size so the UI
   * can update its badge without a refetch.
   */
  toggle: (productId: string) => post<WishlistToggleResult>('/wishlist/toggle/', { product_id: productId }),

  /** Entries are addressed by product id. */
  remove: (productId: string) => del<void>(`/wishlist/${productId}/`),
}

export type WishlistService = typeof wishlistService
