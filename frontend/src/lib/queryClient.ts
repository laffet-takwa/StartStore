import { QueryClient } from '@tanstack/react-query'

import { ApiError } from '@/services/api'

/**
 * One client for the whole app.
 *
 * Retry policy is deliberately asymmetric: 4xx responses are deterministic and
 * retrying them just wastes time, while 5xx/network failures are worth one more
 * attempt. Auth failures are never retried.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      gcTime: 5 * 60_000,
      refetchOnWindowFocus: false,
      retry: (failureCount, error) => {
        if (error instanceof ApiError) {
          if (error.isNetwork) return failureCount < 2
          if (error.status >= 400 && error.status < 500) return false
        }
        return failureCount < 1
      },
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 4000),
    },
    mutations: {
      retry: false,
    },
  },
})

/** Cache keys, centralised so invalidation cannot drift from the read path. */
export const queryKeys = {
  profile: ['profile'] as const,
  categories: (params?: unknown) => ['categories', params ?? {}] as const,
  categoryList: ['categories', 'list'] as const,
  products: (query?: unknown) => ['products', query ?? {}] as const,
  product: (id: string) => ['products', 'detail', id] as const,
  productImages: (id: string) => ['products', 'images', id] as const,
  cart: ['cart'] as const,
  cartItems: ['cart', 'items'] as const,
  wishlist: ['wishlist'] as const,
  orders: (query?: unknown) => ['orders', query ?? {}] as const,
  order: (id: string) => ['orders', 'detail', id] as const,
  addresses: ['addresses'] as const,
  adminDashboard: ['admin', 'dashboard'] as const,
  adminProducts: (params?: unknown) => ['admin', 'products', params ?? {}] as const,
  adminProductSummary: ['admin', 'products', 'summary'] as const,
  adminCategories: ['admin', 'categories'] as const,
  adminOrders: (params?: unknown) => ['admin', 'orders', params ?? {}] as const,
  adminUsers: (params?: unknown) => ['admin', 'users', params ?? {}] as const,
}
