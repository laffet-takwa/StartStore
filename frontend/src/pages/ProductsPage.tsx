import { useEffect, useRef, useState } from 'react'

import {
  ErrorState,
  NoResultsState,
  ProductGridSkeleton,
} from '@/components/common/Feedback'
import { Pagination } from '@/components/common/Pagination'
import { Container, Section } from '@/components/layout/Primitives'
import {
  ActiveFilterChips,
  FilterSidebar,
  ProductToolbar,
} from '@/components/product/ProductFilters'
import { ProductGrid } from '@/components/product/ProductCard'
import { useCategories, useProducts } from '@/hooks/useProducts'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { useProductFilters } from '@/hooks/useProductFilters'
import { PAGE_SIZE } from '@/utils/constants'

/**
 * Catalogue listing.
 *
 * All filter state lives in the URL, so a filtered view is shareable and
 * survives a reload. Mobile gets the filter panel in a drawer; desktop gets a
 * sticky sidebar.
 */
export default function ProductsPage() {
  useDocumentTitle('Shop all products — StartStore')

  const { filters, setFilters, clearFilters, activeCount, isFiltered } = useProductFilters()
  const { data, isLoading, isError, error, refetch, isFetching } = useProducts({
    search: filters.search,
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
  const categories = categoryData?.results ?? []
  const products = data?.results ?? []
  const totalPages = Math.max(1, Math.ceil((data?.count ?? 0) / PAGE_SIZE))

  return (
    <>
      <PageHeader
        isFiltered={isFiltered}
        search={filters.search ?? ''}
        onSearch={(search) => setFilters({ search: search || undefined })}
      />
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
                {isLoading ? (
                  <ProductGridSkeleton />
                ) : isError ? (
                  <ErrorState
                    message={error instanceof Error ? error.message : 'Please try again.'}
                    onRetry={() => void refetch()}
                  />
                ) : products.length === 0 ? (
                  <NoResultsState
                    query={filters.search}
                    onClear={isFiltered ? clearFilters : undefined}
                  />
                ) : (
                  <>
                    {/* Dim slightly while refetching a later page. */}
                    <div className={isFetching ? 'opacity-60 transition-opacity' : undefined}>
                      <ProductGrid products={products} />
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
                )}
              </div>
            </div>
          </div>
        </Container>
      </Section>
    </>
  )
}

/**
 * Heading plus an inline search box.
 *
 * The input is local while typing and only committed after a pause, so a search
 * fires once rather than on every keystroke.
 */
function PageHeader({
  isFiltered,
  search,
  onSearch,
}: {
  isFiltered: boolean
  search: string
  onSearch: (value: string) => void
}) {
  const [term, setTerm] = useState(search)
  const debounced = useDebouncedValue(term, 450)
  const lastCommitted = useRef(search)

  // Commit when typing settles, and skip the write when the value is unchanged.
  useEffect(() => {
    const next = debounced.trim()
    if (next !== (lastCommitted.current ?? '')) {
      lastCommitted.current = next
      onSearch(next)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced])

  // Reflect external changes (a cleared filter, a back navigation).
  useEffect(() => {
    setTerm(search)
    lastCommitted.current = search
  }, [search])

  return (
    <div className="border-b border-zinc-100 bg-surface">
      <Container>
        <div className="flex flex-col gap-5 py-8 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-xl">
            <h1 className="text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
              {isFiltered ? 'Filtered results' : 'All products'}
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-ink-muted">
              {isFiltered
                ? 'Narrow it down further, or clear the filters to see everything.'
                : 'Every piece we stock, from electronics to everyday apparel.'}
            </p>
          </div>

          <div className="w-full max-w-sm">
            <input
              type="search"
              value={term}
              onChange={(event) => setTerm(event.target.value)}
              placeholder="Search this catalogue"
              aria-label="Search products"
              className="h-10 w-full rounded-xl border border-zinc-300 bg-white px-3.5 text-sm transition-all focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            />
          </div>
        </div>
      </Container>
    </div>
  )
}
