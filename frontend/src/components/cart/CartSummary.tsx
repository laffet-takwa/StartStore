import { Truck } from 'lucide-react'

import { Button } from '@/components/common/Button'
import { Price } from '@/components/common/Display'
import { cn } from '@/lib/cn'
import type { Cart } from '@/types'
import { formatMoney } from '@/utils/format'

/**
 * Order totals.
 *
 * Every figure is server-computed (`CartSerializer` derives subtotal, shipping and
 * total from current catalogue prices) and is only displayed here, never
 * recalculated in the browser.
 */
export function CartSummary({
  cart,
  className,
  checkoutButton,
  footerNote,
}: {
  cart: Cart
  className?: string
  checkoutButton?: React.ReactNode
  footerNote?: React.ReactNode
}) {
  const remaining = Math.max(0, Number(cart.free_shipping_threshold) - Number(cart.subtotal))
  const qualifiesForFreeShipping = Number(cart.subtotal) >= Number(cart.free_shipping_threshold)

  return (
    <div className={cn('rounded-2xl border border-zinc-200 bg-white shadow-card', className)}>
      <div className="border-b border-zinc-100 px-5 py-4">
        <h2 className="text-base font-semibold tracking-tight text-ink">Order summary</h2>
      </div>

      <dl className="space-y-3 px-5 py-5 text-sm">
        <Row label="Subtotal" value={<Price value={cart.subtotal} />} />
        <Row
          label="Shipping"
          value={
            Number(cart.shipping_cost) === 0 ? (
              <span className="font-medium text-emerald-600">Free</span>
            ) : (
              <Price value={cart.shipping_cost} />
            )
          }
        />

        <div className="!mt-4 border-t border-zinc-100 pt-4">
          <div className="flex items-baseline justify-between">
            <dt className="text-sm font-medium text-ink">Total</dt>
            <dd className="text-lg font-semibold tracking-tight text-ink">
              <Price value={cart.total} />
            </dd>
          </div>
          <p className="mt-0.5 text-right text-2xs text-ink-faint">
            Taxes calculated at checkout
          </p>
        </div>
      </dl>

      {!qualifiesForFreeShipping && cart.items.length > 0 && (
        <div className="mx-5 mb-5 rounded-xl bg-brand-50 px-4 py-3">
          <p className="flex items-start gap-2 text-xs font-medium text-brand-800">
            <Truck className="mt-px h-4 w-4 shrink-0" aria-hidden />
            <span>
              Add <strong className="font-semibold">{formatMoney(remaining)}</strong> more for
              free delivery.
            </span>
          </p>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-brand-100">
            <div
              className="h-full rounded-full bg-brand-600 transition-all duration-500 ease-spring"
              style={{
                width: `${Math.min(
                  100,
                  (Number(cart.subtotal) / Number(cart.free_shipping_threshold || 1)) * 100,
                )}%`,
              }}
            />
          </div>
        </div>
      )}

      {(checkoutButton || footerNote) && (
        <div className="border-t border-zinc-100 bg-surface px-5 py-4">
          {checkoutButton}
          {footerNote && <div className="mt-3 text-center text-2xs text-ink-muted">{footerNote}</div>}
        </div>
      )}
    </div>
  )
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="text-ink-muted">{label}</dt>
      <dd className="font-medium tabular-nums text-ink">{value}</dd>
    </div>
  )
}

/** Compact inline variant used in the drawer. */
export function CartSummaryInline({ cart }: { cart: Cart }) {
  return (
    <dl className="space-y-2 text-sm">
      <Row label="Subtotal" value={<Price value={cart.subtotal} />} />
      <Row
        label="Shipping"
        value={
          Number(cart.shipping_cost) === 0 ? (
            <span className="font-medium text-emerald-600">Free</span>
          ) : (
            <Price value={cart.shipping_cost} />
          )
        }
      />
      <div className="border-t border-zinc-200 pt-2">
        <div className="flex items-baseline justify-between">
          <dt className="font-medium text-ink">Total</dt>
          <dd className="text-base font-semibold text-ink">
            <Price value={cart.total} />
          </dd>
        </div>
      </div>
    </dl>
  )
}

/** Shown on the cart page when the bag is empty. */
export function EmptyBagNotice() {
  return (
    <p className="text-center text-xs text-ink-muted">
      Nothing in your bag yet.{' '}
      <Button variant="ghost" size="sm" className="h-auto p-0 text-brand-700">
        Browse the catalogue
      </Button>
    </p>
  )
}
