import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'

import { ButtonLink, OrderStatusBadge, PaymentStatusBadge } from '@/components/common'
import { Card, CardBody, CardHeader, Price } from '@/components/common/Display'
import { ErrorState, PageLoader } from '@/components/common/Feedback'
import { AdminPageHeader } from '@/components/admin/DataTable'
import {
  BarComparison,
  CustomersStat,
  OrdersStat,
  ProductsStat,
  RevenueStat,
  StatusBreakdown,
} from '@/components/admin/StatCards'
import { useDashboard } from '@/hooks/useAdmin'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { formatDateTime, formatMoney, pluralize } from '@/utils/format'
import { ORDER_STATUS_META, ROUTES } from '@/utils/constants'

export default function AdminDashboardPage() {
  useDocumentTitle('Dashboard — StartStore admin')

  const { data, isLoading, isError, error, refetch } = useDashboard()

  if (isLoading) return <PageLoader label="Loading dashboard" />

  if (isError || !data) {
    return (
      <ErrorState
        title="Could not load the dashboard"
        message={error instanceof Error ? error.message : 'Please try again.'}
        onRetry={() => void refetch()}
      />
    )
  }

  const { metrics, recent_orders: recentOrders, low_stock_products: lowStock } = data

  return (
    <div className="space-y-8">
      <AdminPageHeader
        title="Dashboard"
        description={`Store performance as of ${formatDateTime(metrics.generated_at)}.`}
        action={
          <ButtonLink to={ROUTES.admin.products} variant="outline" size="sm">
            Manage products
          </ButtonLink>
        }
      />

      {/* KPI row */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <RevenueStat
          total={metrics.revenue_total}
          thisMonth={metrics.revenue_this_month}
          previousMonth={metrics.revenue_previous_month}
        />
        <OrdersStat total={metrics.orders_total} pending={metrics.orders_pending} />
        <ProductsStat total={metrics.products_total} lowStock={metrics.low_stock} />
        <CustomersStat
          total={metrics.users_total}
          newThisMonth={metrics.users_new_this_month}
        />
      </div>

      {/* Secondary figures */}
      <div className="grid gap-4 sm:grid-cols-3">
        <MiniStat label="Average order value" value={formatMoney(metrics.average_order_value)} />
        <MiniStat label="Units sold" value={String(metrics.units_sold)} />
        <MiniStat
          label="Refunded"
          value={formatMoney(metrics.refunded_total)}
          tone={Number(metrics.refunded_total) > 0 ? 'warning' : 'default'}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Revenue overview */}
        <Card>
          <CardHeader>
            <h2 className="text-base font-semibold tracking-tight text-ink">
              Sales overview
            </h2>
          </CardHeader>
          <CardBody>
            <BarComparison
              data={[
                { label: 'All time', value: Number(metrics.revenue_total) },
                { label: 'This month', value: Number(metrics.revenue_this_month) },
                { label: 'Last month', value: Number(metrics.revenue_previous_month) },
              ]}
              formatValue={(value) => formatMoney(value)}
            />
            <dl className="mt-6 grid grid-cols-2 gap-4 border-t border-zinc-100 pt-5">
              <Figure label="Orders this month" value={String(metrics.orders_this_month)} />
              <Figure label="Awaiting payment" value={String(metrics.awaiting_payment)} />
              <Figure label="Items on sale" value={String(metrics.on_sale)} />
              <Figure
                label="Active categories"
                value={`${metrics.categories_active} / ${metrics.categories_total}`}
              />
            </dl>
          </CardBody>
        </Card>

        {/* Order status overview */}
        <Card>
          <CardHeader>
            <h2 className="text-base font-semibold tracking-tight text-ink">
              Order status overview
            </h2>
          </CardHeader>
          <CardBody>
            <StatusBreakdown
              total={metrics.orders_total}
              segments={[
                {
                  label: 'Pending',
                  value: metrics.orders_pending,
                  colour: ORDER_STATUS_META.pending.dot,
                },
                {
                  label: 'Processing',
                  value: metrics.orders_processing,
                  colour: ORDER_STATUS_META.processing.dot,
                },
                {
                  label: 'Shipped',
                  value: metrics.orders_shipped,
                  colour: ORDER_STATUS_META.shipped.dot,
                },
                {
                  label: 'Delivered',
                  value: metrics.orders_delivered,
                  colour: ORDER_STATUS_META.delivered.dot,
                },
                {
                  label: 'Cancelled',
                  value: metrics.orders_cancelled,
                  colour: ORDER_STATUS_META.cancelled.dot,
                },
              ]}
            />
          </CardBody>
        </Card>
      </div>

      {/* Low stock */}
      <Card>
        <CardHeader className="flex items-center justify-between">
          <h2 className="text-base font-semibold tracking-tight text-ink">
            Low stock
            <span className="ml-2 text-sm font-normal text-ink-muted">
              {pluralize(lowStock.length, 'product')}
            </span>
          </h2>
          <Link
            to={ROUTES.admin.products}
            className="inline-flex items-center gap-1 text-xs font-semibold text-brand-700 hover:underline"
          >
            View all
            <ArrowRight className="h-3.5 w-3.5" aria-hidden />
          </Link>
        </CardHeader>

        {lowStock.length === 0 ? (
          <CardBody>
            <p className="py-4 text-center text-sm text-ink-muted">
              Everything is comfortably in stock.
            </p>
          </CardBody>
        ) : (
          <ul className="divide-y divide-zinc-100">
            {lowStock.map((product) => (
              <li key={product.id} className="flex items-center justify-between gap-4 px-5 py-3.5">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-ink">{product.name}</p>
                  <p className="mt-0.5 text-xs text-ink-faint">
                    {product.sku || 'No SKU'} · {product.category_name ?? 'Uncategorised'}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <span
                    className={`rounded-full px-2.5 py-1 text-2xs font-semibold ${
                      product.stock === 0
                        ? 'bg-rose-50 text-rose-700'
                        : 'bg-amber-50 text-amber-800'
                    }`}
                  >
                    {product.stock === 0 ? 'Out of stock' : `${product.stock} left`}
                  </span>
                  <span className="text-sm font-semibold text-ink">
                    <Price value={product.final_price} />
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {/* Recent orders */}
      <Card>
        <CardHeader className="flex items-center justify-between">
          <h2 className="text-base font-semibold tracking-tight text-ink">Recent orders</h2>
          <Link
            to={ROUTES.admin.orders}
            className="inline-flex items-center gap-1 text-xs font-semibold text-brand-700 hover:underline"
          >
            View all
            <ArrowRight className="h-3.5 w-3.5" aria-hidden />
          </Link>
        </CardHeader>

        {recentOrders.length === 0 ? (
          <CardBody>
            <p className="py-4 text-center text-sm text-ink-muted">No orders yet.</p>
          </CardBody>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="border-b border-zinc-100">
                <tr>
                  <Th>Order</Th>
                  <Th>Customer</Th>
                  <Th>Status</Th>
                  <Th align="right">Total</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {recentOrders.map((order) => (
                  <tr key={order.id} className="transition-colors hover:bg-surface">
                    <Td>
                      <Link
                        to={ROUTES.admin.orders}
                        className="font-mono text-xs font-semibold text-ink hover:text-brand-700"
                      >
                        {order.order_number}
                      </Link>
                      <p className="mt-0.5 text-2xs text-ink-faint">
                        {formatDateTime(order.created_at)}
                      </p>
                    </Td>
                    <Td>
                      <p className="truncate text-sm text-ink-soft">{order.user_email}</p>
                    </Td>
                    <Td>
                      <div className="flex flex-wrap gap-1.5">
                        <OrderStatusBadge status={order.status} />
                        <PaymentStatusBadge status={order.payment_status} />
                      </div>
                    </Td>
                    <Td align="right" className="font-semibold text-ink">
                      {formatMoney(order.total)}
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* Small pieces                                                                 */
/* -------------------------------------------------------------------------- */

function MiniStat({
  label,
  value,
  tone = 'default',
}: {
  label: string
  value: string
  tone?: 'default' | 'warning'
}) {
  return (
    <Card className="px-5 py-4">
      <p className="text-xs font-medium uppercase tracking-[0.08em] text-ink-muted">{label}</p>
      <p
        className={`mt-1.5 text-lg font-semibold tracking-tight ${
          tone === 'warning' ? 'text-amber-700' : 'text-ink'
        }`}
      >
        {value}
      </p>
    </Card>
  )
}

function Figure({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-2xs uppercase tracking-wide text-ink-faint">{label}</dt>
      <dd className="mt-1 text-sm font-semibold text-ink">{value}</dd>
    </div>
  )
}

function Th({ children, align = 'left' }: { children?: React.ReactNode; align?: 'left' | 'right' }) {
  return (
    <th
      scope="col"
      className={`px-5 py-2.5 text-2xs font-semibold uppercase tracking-[0.08em] text-ink-muted ${
        align === 'right' ? 'text-right' : 'text-left'
      }`}
    >
      {children}
    </th>
  )
}

function Td({
  children,
  align = 'left',
  className,
}: {
  children?: React.ReactNode
  align?: 'left' | 'right'
  className?: string
}) {
  return (
    <td
      className={`border-b border-zinc-100 px-5 py-3.5 align-middle text-ink-soft ${
        align === 'right' ? 'text-right' : 'text-left'
      } ${className ?? ''}`}
    >
      {children}
    </td>
  )
}
