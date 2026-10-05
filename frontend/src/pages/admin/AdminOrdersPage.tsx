import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Search, XCircle } from 'lucide-react'

import { Button, Input, OrderStatusBadge, PaymentStatusBadge, Price } from '@/components/common'
import { ErrorState, NoResultsState, TableSkeleton } from '@/components/common/Feedback'
import { ConfirmDialog, Modal } from '@/components/common/Overlay'
import {
  AdminPageHeader,
  TablePagination,
  TableWrapper,
  Td,
  Th,
  Tr,
} from '@/components/admin/DataTable'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { useAdminCancelOrder, useAdminOrders, useUpdateOrderStatus } from '@/hooks/useOrders'
import { adminOrderService } from '@/services/order.service'
import { toast } from '@/store/uiStore'
import type { Order, OrderStatus, PaymentStatus } from '@/types'
import { ORDER_STATUSES, PAYMENT_STATUSES } from '@/types'
import { formatDateTime, formatMoney } from '@/utils/format'
import { ORDER_PAGE_SIZE } from '@/utils/constants'
import { ORDER_STATUS_META } from '@/utils/constants'

export default function AdminOrdersPage() {
  useDocumentTitle('Orders — StartStore admin')

  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<OrderStatus | ''>('')
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus | ''>('')
  const [page, setPage] = useState(1)
  const [inspecting, setInspecting] = useState<Order | null>(null)
  const [cancelTarget, setCancelTarget] = useState<Order | null>(null)

  const debounced = useDebouncedValue(search, 400)
  const updateStatus = useUpdateOrderStatus()
  const cancelOrder = useAdminCancelOrder()

  const { data, isLoading, isError, error, refetch } = useAdminOrders({
    search: debounced || undefined,
    status: status || undefined,
    payment_status: paymentStatus || undefined,
    page,
    page_size: ORDER_PAGE_SIZE,
  })

  const orders = data?.results ?? []
  const count = data?.count ?? 0
  const totalPages = Math.max(1, Math.ceil(count / ORDER_PAGE_SIZE))

  const resetFilters = () => {
    setSearch('')
    setStatus('')
    setPaymentStatus('')
    setPage(1)
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Orders"
        description="Review fulfilment status and move orders through the lifecycle. Status changes are validated by the API."
      />

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="min-w-[200px] flex-1">
          <Input
            leadingIcon={<Search className="h-4 w-4" aria-hidden />}
            placeholder="Order number, email or name"
            aria-label="Search orders"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value)
              setPage(1)
            }}
            className="h-10"
          />
        </div>

        <select
          value={status}
          onChange={(event) => {
            setStatus(event.target.value as OrderStatus | '')
            setPage(1)
          }}
          aria-label="Filter by order status"
          className="h-10 cursor-pointer rounded-lg border border-zinc-300 bg-white px-3 text-sm text-ink focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
        >
          <option value="">All statuses</option>
          {ORDER_STATUSES.map((entry) => (
            <option key={entry} value={entry}>
              {ORDER_STATUS_META[entry].label}
            </option>
          ))}
        </select>

        <select
          value={paymentStatus}
          onChange={(event) => {
            setPaymentStatus(event.target.value as PaymentStatus | '')
            setPage(1)
          }}
          aria-label="Filter by payment status"
          className="h-10 cursor-pointer rounded-lg border border-zinc-300 bg-white px-3 text-sm text-ink focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
        >
          <option value="">All payments</option>
          {PAYMENT_STATUSES.map((entry) => (
            <option key={entry} value={entry}>
              {entry}
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
        ) : orders.length === 0 ? (
          <NoResultsState onClear={resetFilters} />
        ) : (
          <TableWrapper>
            <thead>
              <tr>
                <Th>Order</Th>
                <Th>Customer</Th>
                <Th>Status</Th>
                <Th>Payment</Th>
                <Th align="right">Total</Th>
                <Th align="right">Actions</Th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <Tr key={order.id}>
                  <Td>
                    <button
                      type="button"
                      onClick={() => setInspecting(order)}
                      className="font-mono text-xs font-semibold text-ink hover:text-brand-700"
                    >
                      {order.order_number}
                    </button>
                    <p className="mt-0.5 text-2xs text-ink-faint">
                      {formatDateTime(order.created_at)}
                    </p>
                  </Td>
                  <Td>
                    <p className="truncate text-sm text-ink-soft">{order.user_email}</p>
                    <p className="mt-0.5 text-2xs text-ink-faint">
                      {order.item_count} item{order.item_count === 1 ? '' : 's'}
                    </p>
                  </Td>
                  <Td>
                    <StatusSelect
                      order={order}
                      busy={updateStatus.isPending}
                      onChange={(next, payment) =>
                        updateStatus.mutate({ id: order.id, status: next, payment_status: payment })
                      }
                    />
                  </Td>
                  <Td>
                    <PaymentStatusBadge status={order.payment_status} />
                  </Td>
                  <Td align="right" className="font-semibold text-ink">
                    {formatMoney(order.total)}
                  </Td>
                  <Td align="right">
                    <div className="flex justify-end gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setInspecting(order)}
                        className="text-xs"
                      >
                        Details
                      </Button>
                      {order.status !== 'cancelled' && order.status !== 'delivered' && (
                        <button
                          type="button"
                          aria-label={`Cancel order ${order.order_number}`}
                          onClick={() => setCancelTarget(order)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-faint transition-colors hover:bg-rose-50 hover:text-rose-600"
                        >
                          <XCircle className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </Td>
                </Tr>
              ))}
            </tbody>
          </TableWrapper>
        )}

        {orders.length > 0 && (
          <TablePagination
            page={page}
            totalPages={totalPages}
            count={count}
            pageSize={ORDER_PAGE_SIZE}
            onChange={setPage}
          />
        )}
      </div>

      <OrderDetailModal
        order={inspecting}
        onClose={() => setInspecting(null)}
        onStatusChange={(id, next, payment) =>
          updateStatus.mutate({ id, status: next, payment_status: payment })
        }
      />

      <ConfirmDialog
        open={Boolean(cancelTarget)}
        title="Cancel this order?"
        description={
          cancelTarget
            ? `${cancelTarget.order_number} will be cancelled and its reserved stock returned to the store.`
            : undefined
        }
        confirmLabel="Cancel order"
        variant="danger"
        isLoading={cancelOrder.isPending}
        onCancel={() => setCancelTarget(null)}
        onConfirm={() => {
          if (cancelTarget) cancelOrder.mutate(cancelTarget.id)
          setCancelTarget(null)
        }}
      />
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* Pieces                                                                       */
/* -------------------------------------------------------------------------- */

/**
 * Inline status control.
 *
 * Only the statuses the API reports as reachable are offered, so an illegal
 * transition cannot even be attempted from the UI.
 */
function StatusSelect({
  order,
  onChange,
  busy,
}: {
  order: Order
  onChange: (status: OrderStatus, paymentStatus: PaymentStatus) => void
  busy?: boolean
}) {
  const options = order.next_statuses

  if (options.length === 0) {
    return <OrderStatusBadge status={order.status} />
  }

  return (
    <select
      value={order.status}
      disabled={busy}
      aria-label={`Change status for ${order.order_number}`}
      onChange={(event) =>
        onChange(event.target.value as OrderStatus, order.payment_status)
      }
      className="h-8 cursor-pointer rounded-lg border border-zinc-300 bg-white px-2 text-xs text-ink focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 disabled:opacity-50"
    >
      <option value={order.status}>{ORDER_STATUS_META[order.status].label} (current)</option>
      {options.map((next) => (
        <option key={next} value={next}>
          Move to {ORDER_STATUS_META[next].label}
        </option>
      ))}
    </select>
  )
}

function OrderDetailModal({
  order,
  onClose,
  onStatusChange,
}: {
  order: Order | null
  onClose: () => void
  onStatusChange: (
    id: string,
    status: OrderStatus,
    paymentStatus: PaymentStatus,
  ) => void
}) {
  const markPaid = useMutation({
    mutationFn: (id: string) => adminOrderService.get(id),
  })

  if (!order) return null

  const address = order.shipping_address as Record<string, string>

  return (
    <Modal
      open={Boolean(order)}
      onClose={onClose}
      size="lg"
      title={order.order_number}
      description={`Placed ${formatDateTime(order.created_at)} · ${order.user_email}`}
      footer={
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Button
            variant="outline"
            size="sm"
            leftIcon={<Price value={order.total} />}
            isLoading={markPaid.isPending}
            onClick={() => {
              markPaid.mutate(order.id)
              toast.info('Payment capture is staff-initiated in this MVP', 'Use the payments endpoint.')
            }}
          >
            Refresh order
          </Button>
          <Button size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      }
    >
      <div className="space-y-5">
        <div className="flex flex-wrap items-center gap-2">
          <OrderStatusBadge status={order.status} />
          <PaymentStatusBadge status={order.payment_status} />
          <span className="ml-auto text-lg font-semibold text-ink">
            {formatMoney(order.total)}
          </span>
        </div>

        <div>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-muted">
            Items
          </h3>
          <ul className="divide-y divide-zinc-100 rounded-xl border border-zinc-200">
            {order.items.map((item) => (
              <li key={item.id} className="flex items-baseline justify-between gap-4 px-4 py-2.5">
                <div className="min-w-0">
                  <p className="line-clamp-1 text-sm text-ink">{item.product_name}</p>
                  <p className="mt-0.5 text-2xs text-ink-muted">
                    {item.quantity} × {formatMoney(item.unit_price)}
                  </p>
                </div>
                <span className="shrink-0 text-sm font-medium text-ink">
                  {formatMoney(item.subtotal)}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-muted">
            Delivery address
          </h3>
          <address className="rounded-xl bg-surface px-4 py-3 text-sm not-italic leading-relaxed text-ink-soft">
            {address.full_name}
            <br />
            {address.address_line}
            <br />
            {[address.city, address.postal_code, address.country].filter(Boolean).join(', ')}
          </address>
        </div>

        <div>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-muted">
            Advance status
          </h3>
          {order.next_statuses.length === 0 ? (
            <p className="text-sm text-ink-muted">
              This order has reached a final state and cannot be advanced.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {order.next_statuses.map((next) => (
                <Button
                  key={next}
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    onStatusChange(order.id, next, order.payment_status)
                  }
                >
                  Mark as {ORDER_STATUS_META[next].label.toLowerCase()}
                </Button>
              ))}
            </div>
          )}
        </div>
      </div>
    </Modal>
  )
}
