/**
 * Cart *UI* state.
 *
 * The authoritative cart lives in React Query's cache; this store only holds
 * things the query cache should not: whether the drawer is open and which
 * product was just added (so the drawer can highlight it).
 */

import { create } from 'zustand'

interface CartUiState {
  isDrawerOpen: boolean
  /** Product highlighted in the drawer right after an add-to-cart. */
  lastAddedProductId: string | null
  openDrawer: () => void
  closeDrawer: () => void
  toggleDrawer: () => void
  noteAdded: (productId: string) => void
  clearHighlight: () => void
}

export const useCartUiStore = create<CartUiState>((set) => ({
  isDrawerOpen: false,
  lastAddedProductId: null,
  openDrawer: () => set({ isDrawerOpen: true }),
  closeDrawer: () => set({ isDrawerOpen: false, lastAddedProductId: null }),
  toggleDrawer: () => set((state) => ({ isDrawerOpen: !state.isDrawerOpen })),
  noteAdded: (productId) => set({ isDrawerOpen: true, lastAddedProductId: productId }),
  clearHighlight: () => set({ lastAddedProductId: null }),
}))

/** Mirrors the cart badge without subscribing components to the whole cart. */
interface CartBadgeState {
  count: number
  setCount: (count: number) => void
}

export const useCartBadgeStore = create<CartBadgeState>((set) => ({
  count: 0,
  setCount: (count) => set((state) => (state.count === count ? state : { count })),
}))
