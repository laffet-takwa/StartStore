import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'

import type { ProductOrdering } from '@/types'

export interface ProductFilters {
  search?: string
  category?: string
  min_price?: number
  max_price?: number
  in_stock?: boolean
  is_on_sale?: boolean
  ordering?: ProductOrdering
  page: number
}

export const DEFAULT_FILTERS: ProductFilters = { page: 1 }

/**
 * Filter state lives in the query string.
 *
 * A filtered view is therefore shareable, survives a reload and plays nicely
 * with the back button - which is what people expect from a listing page.
 */
export function useProductFilters(): {
  filters: ProductFilters
  setFilters: (next: Partial<ProductFilters>) => void
  clearFilters: () => void
  activeCount: number
  isFiltered: boolean
} {
  const [searchParams, setSearchParams] = useSearchParams()

  const filters = useMemo<ProductFilters>(() => {
    const readString = (key: string) => {
      const value = searchParams.get(key)
      return value && value !== 'all' ? value : undefined
    }
    const readNumber = (key: string) => {
      const value = Number(searchParams.get(key))
      return Number.isFinite(value) && value > 0 ? value : undefined
    }
    const readBoolean = (key: string) => {
      const value = searchParams.get(key)
      return value === 'true' ? true : value === 'false' ? false : undefined
    }

    return {
      search: readString('q'),
      category: readString('category'),
      min_price: readNumber('min_price'),
      max_price: readNumber('max_price'),
      in_stock: readBoolean('in_stock'),
      is_on_sale: readBoolean('on_sale'),
      ordering: readString('ordering') as ProductOrdering | undefined,
      page: readNumber('page') ?? 1,
    }
  }, [searchParams])

  const setFilters = useCallback(
    (next: Partial<ProductFilters>) => {
      const params = new URLSearchParams(searchParams)

      const write = (key: string, value: unknown) => {
        if (value === undefined || value === null || value === '' || value === 'all') {
          params.delete(key)
        } else {
          params.set(key, String(value))
        }
      }

      // Any change other than an explicit page move resets pagination, otherwise
      // a narrowed filter can leave the user on an empty page 4.
      const onlyPageChanged = Object.keys(next).length === 1 && next.page !== undefined

      if (next.search !== undefined) write('q', next.search)
      if (next.category !== undefined) write('category', next.category)
      if (next.min_price !== undefined) write('min_price', next.min_price)
      if (next.max_price !== undefined) write('max_price', next.max_price)
      if (next.in_stock !== undefined) write('in_stock', next.in_stock)
      if (next.is_on_sale !== undefined) write('on_sale', next.is_on_sale)
      if (next.ordering !== undefined) write('ordering', next.ordering)
      write('page', onlyPageChanged ? next.page : 1)

      setSearchParams(params, { replace: !onlyPageChanged })
    },
    [searchParams, setSearchParams],
  )

  const clearFilters = useCallback(() => {
    setSearchParams(new URLSearchParams(), { replace: true })
  }, [setSearchParams])

  const activeCount = [
    filters.search,
    filters.category,
    filters.min_price,
    filters.max_price,
    filters.in_stock,
    filters.is_on_sale,
  ].filter((value) => value !== undefined && value !== false && value !== '').length

  return {
    filters,
    setFilters,
    clearFilters,
    activeCount,
    isFiltered: activeCount > 0,
  }
}
