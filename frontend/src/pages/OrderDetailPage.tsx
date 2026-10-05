import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, MapPin, XCircle } from 'lucide-react'

import { Button, ButtonLink, OrderStatusBadge, PaymentStatusBadge } from '@/components/common'
import { Price } from '@/components/common/Display'
import { ErrorState, PageLoader } from '@/components/common/Feedback'
import { ConfirmDialog } from '@/components/common/Overlay'
import { OrderTimeline } from '@/components/checkout/CheckoutSteps'
import { Breadcrumbs, Container, Section } from '@/components/layout/Primitives'
import { ProductImage } from '@/components/product/ProductCard'
import { useCancelOrder, useOrder } from '@/hooks/useOrders'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { formatDateTime, formatMoney, pluralize } from '@/utils/format'
import { ROUTES } from '@/utils/constants'

export default function OrderDetailPage() {
  const { orderId } = useParams<{ orderId: string }>()
  const { data: order, isLoading, isError, error, refetch } = useOrder(orderId)
  const cancelOrder = useCancelOrder()
  const [confirmOpen, setConfirmOpen] = useState(false)

  useDocumentTitle(order ? `Order ${order.order_number} — StartStore` : 'Order details')

  if (isLoading) return <PageLoader label="Loading order" />

  if (isError || !order) {
    return (
      <Section>
        <Container size="narrow">
          <ErrorState
            title="Order not found"
            message={
              error instanceof Error
                ? error.message
                : 'We could not find that order. It may belong to another account.'
            }
            onRetry={() => void refetch()}
          />
          <div className="mt-6 text-center">
            <ButtonLink to={ROUTES.orders}>Back to my orders</ButtonLink>
          </div>
        </Container>
      </Section>
    )
  }

  const address = order.shipping_address as Record<string, string>

  return (
    <Section>
      <Container>
        <Breadcrumbs
          className="mb-6"
          items={[
            { label: 'Home', to: ROUTES.home },
            { label: 'My orders', to: ROUTES.orders },
            { label: order.order_number },
          ]}
        />

        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="font-mono text-2xl font-semibold tracking-tight text-ink">
              {order.order_number}
            </h1>
            <p className="mt-1.5 text-sm text-ink-muted">
              Placed {formatDateTime(order.created_at)} · {pluralize(order.item_count, 'item')}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <OrderStatusBadge status={order.status} />
              <PaymentStatusBadge status={order.payment_status} />
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {order.can_cancel && (
              <Button
                variant="outline"
                size="sm"
                leftIcon={<XCircle className="h-4 w-4" />}
                onClick={() => setConfirmOpen(true)}
              >
                Cancel order
              </Button>
            )}
            <ButtonLink to={ROUTES.products} variant="ghost" size="sm">
              Shop again
            </ButtonLink>
          </div>
        </div>

        <div className="mt-8 rounded-2xl border border-zinc-200 bg-white p-6 shadow-card sm:p-7">
          <OrderTimeline status={order.status} />
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_340px] lg:gap-8">
          {/* Items */}
          <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-card">
            <div className="border-b border-zinc-100 px-5 py-4">
              <h2 className="text-base font-semibold tracking-tight text-ink">Items</h2>
            </div>

            <ul className="divide-y divide-zinc-100">
              {order.items.map((item) => (
                <li key={item.id} className="flex items-center gap-4 px-5 py-4">
                  {item.product_id ? (
                    <Link
                      to={ROUTES.product(item.product_id)}
                      className="h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-zinc-200"
                    >
                      <ProductImage
                        src={null}
                        alt={item.product_name}
                        ratio="aspect-square"
                        className="h-full w-full"
                        sizes="64px"
                      />
                    </Link>
                  ) : (
                    // The product row was deleted; the snapshot below still stands.
                    <div className="h-16 w-16 shrink-0 rounded-xl border border-dashed border-zinc-300" />
                  )}

                  <div className="min-w-0 flex-1">
                    {item.product_id ? (
                      <Link
                        to={ROUTES.product(item.product_id)}
                        className="line-clamp-2 text-sm font-medium text-ink hover:text-brand-700"
                      >
                        {item.product_name}
                      </Link>
                    ) : (
                      <p className="line-clamp-2 text-sm font-medium text-ink-muted">
                        {item.product_name}
                        <span className="ml-2 text-2xs uppercase tracking-wide text-ink-faint">
                          no longer in catalogue
                        </span>
                      </p>
                    )}
                    <p className="mt-0.5 text-xs text-ink-muted">
                      {item.quantity} × {formatMoney(item.unit_price)}
                    </p>
                  </div>

                  <p className="shrink-0 text-sm font-semibold text-ink">
                    {formatMoney(item.subtotal)}
                  </p>
                </li>
              ))}
            </ul>

            <dl className="space-y-2.5 border-t border-zinc-100 px-5 py-4 text-sm">
              <div className="flex justify-between">
                <dt className="text-ink-muted">Subtotal</dt>
                <dd className="font-medium text-ink">
                  <Price value={order.subtotal} />
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-ink-muted">Shipping</dt>
                <dd className="font-medium text-ink">
                  {Number(order.shipping_cost) === 0 ? (
                    <span className="text-emerald-600">Free</span>
                  ) : (
                    <Price value={order.shipping_cost} />
                  )}
                </dd>
              </div>
              <div className="flex justify-between border-t border-zinc-100 pt-2.5">
                <dt className="font-semibold text-ink">Total</dt>
                <dd className="text-lg font-semibold text-ink">
                  <Price value={order.total} />
                </dd>
              </div>
            </dl>
          </div>

          {/* Address */}
          <aside className="space-y-4">
            <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-card">
              <h2 className="flex items-center gap-2 text-sm font-semibold text-ink">
                <MapPin className="h-4 w-4 text-ink-faint" aria-hidden />
                Delivery address
              </h2>
              <address className="mt-3 text-sm not-italic leading-relaxed text-ink-soft">
                {address.full_name}
                <br />
                {address.address_line}
                <br />
                {[address.city, address.postal_code, address.country]
                  .filter(Boolean)
                  .join(', ')}
                {address.phone && (
                  <>
                    <br />
                    <span className="text-ink-muted">{address.phone}</span>
                  </>
                )}
              </address>
            </div>

            {order.next_statuses.length > 0 && (
              <div className="rounded-2xl border border-zinc-200 bg-surface p-5">
                <h2 className="text-sm font-semibold text-ink">What happens next</h2>
                <p className="mt-2 text-xs leading-relaxed text-ink-muted">
                  This order is currently{' '}
                  <span className="font-medium text-ink-soft">
                    {order.status_display.toLowerCase()}
                  </span>
                  . We will email {order.user_email} at every stage.
                </p>
              </div>
            )}

            <Link
              to={ROUTES.orders}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-700 hover:underline"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden />
              Back to my orders
            </Link>
          </aside>
        </div>
      </Container>

      <ConfirmDialog
        open={confirmOpen}
        title="Cancel this order?"
        description={
          'We will stop preparing it and return the reserved stock to the store. This cannot be undone.'
        }
        confirmLabel="Cancel order"
        cancelLabel="Keep order"
        variant="danger"
        isLoading={cancelOrder.isPending}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={() => {
          setConfirmOpen(false)
          cancelOrder.mutate(order.id)
        }}
      />
    </Section>
  )
}
