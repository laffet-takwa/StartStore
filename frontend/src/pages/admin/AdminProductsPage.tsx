import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { Archive, Pencil, Plus, Search } from 'lucide-react'

import { Badge, ButtonLink, Input, Price, StockBadge } from '@/components/common'
import { ErrorState, NoResultsState, TableSkeleton } from '@/components/common/Feedback'
import { ConfirmDialog } from '@/components/common/Overlay'
import {
  AdminPageHeader,
  TablePagination,
  TableWrapper,
  Td,
  Th,
  Tr,
} from '@/components/admin/DataTable'
import { ProductImage, primaryImageOf } from '@/components/product/ProductCard'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { useDeleteProduct } from '@/hooks/useAdmin'
import { adminProductService } from '@/services/product.service'
import { useQuery } from '@tanstack/react-query'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { formatDate } from '@/utils/format'
import { ADMIN_PAGE_SIZE } from '@/utils/constants'
import { ROUTES } from '@/utils/constants'
import { queryKeys } from '@/lib/queryClient'

const ORDERINGS = [
  { value: '-created_at', label: 'Newest first' },
  { value: 'name', label: 'Name A–Z' },
  { value: '-units_sold', label: 'Best selling' },
  { value: 'stock', label: 'Lowest stock' },
  { value: '-price', label: 'Highest price' },
]

export default function AdminProductsPage() {
  useDocumentTitle('Products — StartStore admin')

  const [search, setSearch] = useState('')
  const [isActive, setIsActive] = useState<'' | 'true' | 'false'>('')
  const [ordering, setOrdering] = useState('-created_at')
  const [page, setPage] = useState(1)
  const [confirmId, setConfirmId] = useState<string | null>(null)

  const debouncedSearch = useDebouncedValue(search, 400)
  const queryClient = useQueryClient()
  const archiveProduct = useDeleteProduct()

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: queryKeys.adminProducts({
      search: debouncedSearch || undefined,
      is_active: isActive || undefined,
      ordering,
      page,
      page_size: ADMIN_PAGE_SIZE,
    }),
    queryFn: () =>
      adminProductService.list({
        search: debouncedSearch || undefined,
        is_active: isActive === '' ? undefined : isActive === 'true',
        ordering,
        page,
        page_size: ADMIN_PAGE_SIZE,
      }),
    placeholderData: (previous) => previous,
  })

  const products = data?.results ?? []
  const count = data?.count ?? 0
  const totalPages = Math.max(1, Math.ceil(count / ADMIN_PAGE_SIZE))

  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: ['admin', 'products'] })
    void queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] })
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Products"
        description="Manage the catalogue. Archiving hides a product from the storefront but keeps it attached to past orders."
        action={
          <ButtonLink to={ROUTES.admin.productCreate} leftIcon={<Plus className="h-4 w-4" />}>
            New product
          </ButtonLink>
        }
      />

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="min-w-[200px] flex-1">
          <Input
            leadingIcon={<Search className="h-4 w-4" aria-hidden />}
            placeholder="Search by name"
            aria-label="Search products"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value)
              setPage(1)
            }}
            className="h-10"
          />
        </div>

        <select
          value={isActive}
          onChange={(event) => {
            setIsActive(event.target.value as '' | 'true' | 'false')
            setPage(1)
          }}
          aria-label="Filter by visibility"
          className="h-10 cursor-pointer rounded-lg border border-zinc-300 bg-white px-3 text-sm text-ink focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
        >
          <option value="">All visibility</option>
          <option value="true">Visible</option>
          <option value="false">Archived</option>
        </select>

        <select
          value={ordering}
          onChange={(event) => {
            setOrdering(event.target.value)
            setPage(1)
          }}
          aria-label="Sort products"
          className="h-10 cursor-pointer rounded-lg border border-zinc-300 bg-white px-3 text-sm text-ink focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
        >
          {ORDERINGS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-card">
        {isLoading ? (
          <TableSkeleton rows={8} columns={6} />
        ) : isError ? (
          <ErrorState
            className="m-5"
            message={error instanceof Error ? error.message : 'Please try again.'}
            onRetry={() => void refetch()}
          />
        ) : products.length === 0 ? (
          <NoResultsState
            query={debouncedSearch}
            onClear={() => {
              setSearch('')
              setIsActive('')
            }}
          />
        ) : (
          <TableWrapper>
            <thead>
              <tr>
                <Th>Product</Th>
                <Th>SKU</Th>
                <Th>Category</Th>
                <Th align="right">Price</Th>
                <Th align="right">Stock</Th>
                <Th align="right">Added</Th>
                <Th align="right">Actions</Th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <Tr key={product.id}>
                  <Td>
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg border border-zinc-200">
                        <ProductImage
                          src={primaryImageOf(product)}
                          alt={product.name}
                          ratio="aspect-square"
                          className="h-full w-full"
                          sizes="40px"
                        />
                      </div>
                      <div className="min-w-0">
                        <Link
                          to={ROUTES.admin.productEdit(product.id)}
                          className="line-clamp-1 text-sm font-medium text-ink hover:text-brand-700"
                        >
                          {product.name}
                        </Link>
                        {!product.is_active && (
                          <Badge variant="warning" className="mt-1">
                            Archived
                          </Badge>
                        )}
                      </div>
                    </div>
                  </Td>
                  <Td className="font-mono text-xs">{product.sku || '—'}</Td>
                  <Td>{product.category?.name ?? '—'}</Td>
                  <Td align="right">
                    <span className="font-medium text-ink">
                      <Price value={product.final_price} />
                    </span>
                    {product.discount_price && (
                      <span className="ml-1.5 text-2xs text-ink-faint">
                        <Price value={product.price} />
                      </span>
                    )}
                  </Td>
                  <Td align="right">
                    <StockBadge stock={product.stock} />
                  </Td>
                  <Td align="right" className="text-xs">
                    {formatDate(product.created_at)}
                  </Td>
                  <Td align="right">
                    <div className="flex justify-end gap-1">
                      <Link
                        to={ROUTES.admin.productEdit(product.id)}
                        aria-label={`Edit ${product.name}`}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-muted transition-colors hover:bg-zinc-100 hover:text-ink"
                      >
                        <Pencil className="h-4 w-4" />
                      </Link>
                      <button
                        type="button"
                        aria-label={`Archive ${product.name}`}
                        onClick={() => setConfirmId(product.id)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-faint transition-colors hover:bg-rose-50 hover:text-rose-600"
                      >
                        <Archive className="h-4 w-4" />
                      </button>
                    </div>
                  </Td>
                </Tr>
              ))}
            </tbody>
          </TableWrapper>
        )}

        {!isLoading && !isError && products.length > 0 && (
          <TablePagination
            page={page}
            totalPages={totalPages}
            count={count}
            pageSize={ADMIN_PAGE_SIZE}
            onChange={setPage}
          />
        )}
      </div>

      <ConfirmDialog
        open={Boolean(confirmId)}
        title="Archive this product?"
        description="It will be hidden from the storefront. Past orders keep their saved copy of the name and price."
        confirmLabel="Archive product"
        variant="danger"
        isLoading={archiveProduct.isPending}
        onCancel={() => setConfirmId(null)}
        onConfirm={() => {
          if (confirmId) archiveProduct.mutate(confirmId)
          setConfirmId(null)
          refresh()
        }}
      />
    </div>
  )
}
