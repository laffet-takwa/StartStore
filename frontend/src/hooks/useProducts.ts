import { useQuery } from '@tanstack/react-query'

import { categoryService, productService } from '@/services/product.service'
import type { ProductQuery } from '@/types'
import { PAGE_SIZE } from '@/utils/constants'
import { queryKeys } from '@/lib/queryClient'

/**
 * Paginated product list.
 *
 * `placeholderData: (previous) => previous` keeps the current page on screen
 * while the next one loads, so the grid never flashes empty between pages.
 */
export function useProducts(query: ProductQuery = {}) {
  const { page = 1, page_size = PAGE_SIZE, ...filters } = query

  const result = useQuery({
    queryKey: queryKeys.products({ ...filters, page, page_size }),
    queryFn: () => productService.list({ ...filters, page, page_size }),
    placeholderData: (previous) => previous,
  })

  const count = result.data?.count ?? 0
  const totalPages = Math.max(1, Math.ceil(count / page_size))

  return {
    ...result,
    products: result.data?.results ?? [],
    count,
    /** Clamped, so deleting the last item on page 3 cannot strand the user. */
    page: Math.min(page, totalPages),
    totalPages,
  }
}

export function useProduct(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.product(id ?? ''),
    queryFn: () => productService.get(id as string),
    enabled: Boolean(id),
  })
}

/**
 * Related products: same category, newest first.
 * Returns an empty list when the product is uncategorised, since there is no
 * sensible fallback that is not "everything".
 */
export function useRelatedProducts(
  productId: string | undefined,
  categoryId: string | null | undefined,
  limit = 4,
) {
  return useQuery({
    queryKey: ['products', 'related', productId, categoryId, limit],
    queryFn: async () => {
      const response = await productService.list({
        category: categoryId ?? undefined,
        ordering: '-created_at',
        page_size: limit + 1, // the current product is usually in this slice
      })
      return response.results.filter((item) => item.id !== productId).slice(0, limit)
    },
    enabled: Boolean(productId && categoryId),
  })
}

export function useCategories(params?: { is_active?: boolean; has_products?: boolean }) {
  return useQuery({
    queryKey: queryKeys.categories(params),
    queryFn: () => categoryService.list(params),
    // Categories change rarely; a long stale time stops every card on a page
    // from triggering its own refetch.
    staleTime: 5 * 60_000,
  })
}

/** Admin variant: includes inactive categories. */
export function useAllCategories() {
  return useCategories({ is_active: undefined })
}

export function useCategory(id: string | undefined) {
  return useQuery({
    queryKey: [...queryKeys.categoryList, 'detail', id],
    queryFn: () => categoryService.get(id as string),
    enabled: Boolean(id),
  })
}
