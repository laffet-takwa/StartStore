import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'

import { NoResultsState, ErrorState } from '@/components/common/Feedback'
import { Pagination } from '@/components/common/Pagination'
import { Container, Section } from '@/components/layout/Primitives'
import {
  ActiveFilterChips,
  FilterSidebar,
  ProductToolbar,
} from '@/components/product/ProductFilters'
import { ProductGrid } from '@/components/product/ProductCard'
import { ProductGridSkeleton } from '@/components/common/Feedback'
import { useCategories, useProducts } from '@/hooks/useProducts'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { useProductFilters } from '@/hooks/useProductFilters'
import { PAGE_SIZE } from '@/utils/constants'

/**
 * Search results.
 *
 * Shares the catalogue listing's filter machinery, so a search can be narrowed
 * by category and price with the same URL contract.
 */
export default function SearchResultsPage() {
  const [searchParams] = useSearchParams()
  const query = searchParams.get('q') ?? ''
  const { filters, setFilters, clearFilters, activeCount } = useProductFilters()
  useDocumentTitle(query ? `“${query}” — StartStore` : 'Search — StartStore')

  // The query string param wins over any `?q=` already on the filter state.
  const term = query || filters.search || ''

  const { data, isLoading, isError, error, refetch, isFetching } = useProducts({
    search: term || undefined,
    category: filters.category,
    min_price: filters.min_price,
    max_price: filters.max_price,
    in_stock: filters.in_stock,
    is_on_sale: filters.is_on_sale,
    ordering: filters.ordering,
    page: filters.page,
    page_size: PAGE_SIZE,
  })

  const { data: categoryData } = useCategories()
  const categories = useMemo(() => categoryData?.results ?? [], [categoryData])

  const totalPages = Math.max(1, Math.ceil((data?.count ?? 0) / PAGE_SIZE))

  return (
    <>
      <div className="border-b border-zinc-100 bg-surface">
        <Container>
          <div className="py-8">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-brand-600">
              Search
            </p>
            <h1 className="mt-1.5 text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
              {term ? (
                <>
                  Results for <span className="text-brand-700">“{term}”</span>
                </>
              ) : (
                'What are you looking for?'
              )}
            </h1>
            {term && !isLoading && (
              <p className="mt-2 text-sm text-ink-muted">
                {data?.count ?? 0} result{data?.count === 1 ? '' : 's'}
              </p>
            )}
          </div>
        </Container>
      </div>

      <Section className="pt-8 sm:pt-10">
        <Container>
          <div className="flex gap-8 lg:gap-10">
            <FilterSidebar
              filters={filters}
              categories={categories}
              onChange={setFilters}
              onClear={clearFilters}
              activeCount={activeCount}
            />

            <div className="min-w-0 flex-1">
              <div className="space-y-4">
                <ProductToolbar
                  filters={filters}
                  onChange={setFilters}
                  onClear={clearFilters}
                  activeCount={activeCount}
                  resultCount={data?.count ?? 0}
                  totalCount={data?.count ?? 0}
                />
                <ActiveFilterChips
                  filters={filters}
                  categories={categories}
                  onChange={setFilters}
                  onClear={clearFilters}
                />
              </div>

              <div className="mt-6">
{term ? (
                  isLoading ? (
                    <ProductGridSkeleton />
                  ) : isError ? (
                    <ErrorState
                      message={error instanceof Error ? error.message : 'Please try again.'}
                      onRetry={() => void refetch()}
                    />
                  ) : (data?.results.length ?? 0) === 0 ? (
                    <NoResultsState query={term} />
                  ) : (
                    <>
                      <div className={isFetching ? 'opacity-60 transition-opacity' : undefined}>
                        <ProductGrid products={data?.results ?? []} />
                      </div>
                      <Pagination
                        className="mt-12"
                        page={filters.page}
                        totalPages={totalPages}
                        onChange={(page) => {
                          setFilters({ page })
                          window.scrollTo({ top: 0, behavior: 'smooth' })
                        }}
                        summary={{
                          from: (filters.page - 1) * PAGE_SIZE + 1,
                          to: Math.min(filters.page * PAGE_SIZE, data?.count ?? 0),
                          total: data?.count ?? 0,
                        }}
                      />
                    </>
                  )
                ) : (
                  <NoResultsState />
                )}
              </div>
            </div>
          </div>
        </Container>
      </Section>
    </>
  )
}
