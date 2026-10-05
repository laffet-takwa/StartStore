import { useState } from 'react'
import { Link } from 'react-router-dom'
import { PackageOpen } from 'lucide-react'

import { Button, ButtonLink, OrderStatusBadge, PaymentStatusBadge } from '@/components/common'
import { Price } from '@/components/common/Display'
import { EmptyState, ErrorState, TableSkeleton } from '@/components/common/Feedback'
import { Pagination } from '@/components/common/Pagination'
import { Container, Section } from '@/components/layout/Primitives'
import { useOrders } from '@/hooks/useOrders'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { cn } from '@/lib/cn'
import { ORDER_STATUSES, type OrderStatus } from '@/types'
import { formatDateTime, pluralize } from '@/utils/format'
import { ORDER_PAGE_SIZE } from '@/utils/constants'
import { ROUTES } from '@/utils/constants'

export default function OrdersPage() {
  useDocumentTitle('My orders — StartStore')

  const [status, setStatus] = useState<OrderStatus | ''>('')
  const [page, setPage] = useState(1)

  const { data, isLoading, isError, error, refetch } = useOrders({
    status: status || undefined,
    page,
    page_size: ORDER_PAGE_SIZE,
  })

  const orders = data?.results ?? []
  const totalPages = Math.max(1, Math.ceil((data?.count ?? 0) / ORDER_PAGE_SIZE))

  const tabs: { value: OrderStatus | ''; label: string }[] = [
    { value: '', label: 'All' },
    ...ORDER_STATUSES.map((entry) => ({ value: entry, label: entry })),
  ]

  return (
    <Section>
      <Container>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
              My orders
            </h1>
            {!isLoading && data && (
              <p className="mt-1.5 text-sm text-ink-muted">
                {pluralize(data.count, 'order')}
              </p>
            )}
          </div>
          <ButtonLink to={ROUTES.products} variant="outline" size="sm">
            Shop again
          </ButtonLink>
        </div>

        {/* Status filter */}
        <div className="mt-7 flex flex-wrap gap-1.5">
          {tabs.map((tab) => (
            <button
              key={tab.value || 'all'}
              type="button"
              onClick={() => {
                setStatus(tab.value)
                setPage(1)
              }}
              className={cn(
                'rounded-full border px-3.5 py-1.5 text-xs font-medium capitalize transition-colors',
                status === tab.value
                  ? 'border-ink bg-ink text-white'
                  : 'border-zinc-300 text-ink-soft hover:border-zinc-400 hover:bg-zinc-50',
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="mt-6">
          {isLoading ? (
            <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white">
              <TableSkeleton rows={4} columns={4} />
            </div>
          ) : isError ? (
            <ErrorState
              message={error instanceof Error ? error.message : 'Please try again.'}
              onRetry={() => void refetch()}
            />
          ) : orders.length === 0 ? (
            <EmptyState
              icon={<PackageOpen className="h-5 w-5 text-ink-faint" aria-hidden />}
              title={status ? `No ${status} orders` : 'No orders yet'}
              description={
                status
                  ? 'Try a different status filter to see your other orders.'
                  : 'Once you place an order it will appear here with tracking details.'
              }
              action={
                status ? (
                  <Button variant="outline" onClick={() => setStatus('')}>
                    Show all orders
                  </Button>
                ) : (
                  <ButtonLink to={ROUTES.products}>Start shopping</ButtonLink>
                )
              }
            />
          ) : (
            <>
              <ul className="divide-y divide-zinc-100 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-card">
                {orders.map((order) => (
                  <li key={order.id}>
                    <Link
                      to={ROUTES.order(order.id)}
                      className="block px-5 py-4 transition-colors hover:bg-surface"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-mono text-sm font-semibold tracking-wide text-ink">
                            {order.order_number}
                          </p>
                          <p className="mt-0.5 text-xs text-ink-muted">
                            Placed {formatDateTime(order.created_at)} ·{' '}
                            {pluralize(order.item_count, 'item')}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <OrderStatusBadge status={order.status} />
                          <PaymentStatusBadge status={order.payment_status} />
                        </div>
                      </div>
                      <div className="mt-3 flex items-center justify-between">
                        <p className="text-sm text-ink-muted">
                          {order.can_cancel && 'You can still cancel this order'}
                        </p>
                        <p className="text-base font-semibold text-ink">
                          <Price value={order.total} />
                        </p>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>

              <Pagination
                className="mt-10"
                page={page}
                totalPages={totalPages}
                onChange={setPage}
                summary={{
                  from: (page - 1) * ORDER_PAGE_SIZE + 1,
                  to: Math.min(page * ORDER_PAGE_SIZE, data?.count ?? 0),
                  total: data?.count ?? 0,
                }}
              />
            </>
          )}
        </div>
      </Container>
    </Section>
  )
}
