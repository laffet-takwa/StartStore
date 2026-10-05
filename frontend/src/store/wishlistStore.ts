/**
 * Wishlist ids mirrored out of React Query.
 *
 * Product cards render many wishlist buttons; giving each one its own query
 * would be wasteful. The id set keeps the toggles instant and lets the grid use a
 * single source for the filled/outline state.
 */

import { create } from 'zustand'

interface WishlistState {
  ids: Set<string>
  count: number
  sync: (ids: string[], count?: number) => void
  add: (id: string) => void
  remove: (id: string) => void
  reset: () => void
}

export const useWishlistStore = create<WishlistState>((set) => ({
  ids: new Set<string>(),
  count: 0,

  sync: (ids, count) =>
    set({
      ids: new Set(ids),
      count: count ?? ids.length,
    }),

  add: (id) =>
    set((state) => {
      if (state.ids.has(id)) return state
      const next = new Set(state.ids)
      next.add(id)
      return { ids: next, count: next.size }
    }),

  remove: (id) =>
    set((state) => {
      if (!state.ids.has(id)) return state
      const next = new Set(state.ids)
      next.delete(id)
      return { ids: next, count: next.size }
    }),

  reset: () => set({ ids: new Set<string>(), count: 0 }),
}))
