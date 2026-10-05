import { Link, useParams } from 'react-router-dom'
import { ArrowRight, CheckCircle2, Clock, Package, Truck } from 'lucide-react'

import { ButtonLink, OrderStatusBadge, PaymentStatusBadge } from '@/components/common'
import { Price } from '@/components/common/Display'
import { Alert, ErrorState, PageLoader } from '@/components/common/Feedback'
import { OrderTimeline } from '@/components/checkout/CheckoutSteps'
import { Container, Section } from '@/components/layout/Primitives'
import { useOrder } from '@/hooks/useOrders'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { formatDateTime, formatMoney } from '@/utils/format'
import { ROUTES } from '@/utils/constants'

export default function OrderSuccessPage() {
  const { orderId } = useParams<{ orderId: string }>()
  const { data: order, isLoading, isError, error } = useOrder(orderId)
  useDocumentTitle(order ? `Order ${order.order_number} — StartStore` : 'Order placed')

  if (isLoading) return <PageLoader label="Confirming your order" />

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
          />
          <div className="mt-6 text-center">
            <ButtonLink to={ROUTES.orders}>View your orders</ButtonLink>
          </div>
        </Container>
      </Section>
    )
  }

  const address = order.shipping_address as Record<string, string>

  return (
    <Section>
      <Container size="narrow">
        {/* Confirmation hero */}
        <div className="flex flex-col items-center text-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
            <CheckCircle2 className="h-8 w-8" aria-hidden />
          </span>
          <h1 className="mt-6 text-3xl font-semibold tracking-tight text-ink">
            Thank you for your order
          </h1>
          <p className="mt-3 text-[0.9375rem] leading-relaxed text-ink-muted">
            We have your order and will email you when it ships. Your reference is
            below.
          </p>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
            <span className="rounded-xl bg-ink px-4 py-2 font-mono text-sm font-semibold tracking-wide text-white">
              {order.order_number}
            </span>
            <OrderStatusBadge status={order.status} />
            <PaymentStatusBadge status={order.payment_status} />
          </div>
        </div>

        {/* What happens next */}
        <ol className="mt-10 grid gap-4 sm:grid-cols-3">
          {[
            {
              icon: Clock,
              title: 'Order received',
              body: formatDateTime(order.created_at),
            },
            {
              icon: Package,
              title: 'Being prepared',
              body: 'We will confirm dispatch by email.',
            },
            {
              icon: Truck,
              title: 'On its way',
              body: `Delivering to ${address.city || 'your address'}.`,
            },
          ].map((step) => (
            <li key={step.title} className="rounded-2xl border border-zinc-200 bg-white p-5">
              <step.icon className="h-5 w-5 text-brand-600" aria-hidden />
              <p className="mt-3 text-sm font-semibold text-ink">{step.title}</p>
              <p className="mt-1 text-xs leading-relaxed text-ink-muted">{step.body}</p>
            </li>
          ))}
        </ol>

        {/* Progress */}
        <div className="mt-8 rounded-2xl border border-zinc-200 bg-white p-6 shadow-card">
          <OrderTimeline status={order.status} />
        </div>

        {/* Items */}
        <div className="mt-8 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-card">
          <div className="border-b border-zinc-100 px-5 py-4">
            <h2 className="text-base font-semibold tracking-tight text-ink">
              Order summary
            </h2>
          </div>

          <ul className="divide-y divide-zinc-100">
            {order.items.map((item) => (
              <li key={item.id} className="flex items-baseline justify-between gap-4 px-5 py-3.5">
                <div className="min-w-0">
                  <p className="line-clamp-1 text-sm font-medium text-ink">
                    {item.product_name}
                  </p>
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

          <div className="border-t border-zinc-100 bg-surface px-5 py-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
              Delivering to
            </p>
            <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">
              {address.full_name}
              <br />
              {address.address_line}
              <br />
              {[address.city, address.postal_code, address.country].filter(Boolean).join(', ')}
            </p>
          </div>
        </div>

        {order.payment_status === 'pending' && (
          <Alert variant="info" className="mt-6">
            This order is awaiting payment. A member of our team will confirm your
            transaction — nothing further is needed from you right now.
          </Alert>
        )}

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <ButtonLink to={ROUTES.orders} rightIcon={<ArrowRight className="h-4 w-4" />}>
            View my orders
          </ButtonLink>
          <ButtonLink to={ROUTES.products} variant="outline">
            Continue shopping
          </ButtonLink>
        </div>

        <p className="mt-6 text-center text-xs text-ink-muted">
          Need to change something?{' '}
          <Link to={ROUTES.order(order.id)} className="font-medium text-brand-700 hover:underline">
            View order details
          </Link>{' '}
          — you can cancel while it is still being prepared.
        </p>
      </Container>
    </Section>
  )
}
