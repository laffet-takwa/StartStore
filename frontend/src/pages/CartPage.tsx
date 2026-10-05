import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Lock, ShoppingBag, Trash2 } from 'lucide-react'

import { Button, ButtonLink } from '@/components/common'
import { Alert, EmptyState } from '@/components/common/Feedback'
import { ConfirmDialog } from '@/components/common/Overlay'
import { CartItemRow } from '@/components/cart/CartItemRow'
import { CartSummary } from '@/components/cart/CartSummary'
import { Container, Section } from '@/components/layout/Primitives'
import { useCart, useCartMutations } from '@/hooks/useCart'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { pluralize } from '@/utils/format'
import { ROUTES } from '@/utils/constants'

export default function CartPage() {
  useDocumentTitle('Your bag — StartStore')

  const { cart, items, isLoading, isError, error, refetch, count } = useCart()
  const { updateItem, removeItem, clearCart, updatePending, removePending, clearPending } =
    useCartMutations()
  const [confirmClear, setConfirmClear] = useState(false)

  // A line the store will not fulfil must block checkout rather than fail at it.
  const hasUnavailableItems = items.some((item) => !item.is_available)

  if (isError) {
    return (
      <Section>
        <Container>
          <Alert
            variant="danger"
            title="We could not load your bag"
            action={
              <Button size="sm" variant="outline" onClick={() => void refetch()}>
                Retry
              </Button>
            }
          >
            {error instanceof Error ? error.message : 'Please try again.'}
          </Alert>
        </Container>
      </Section>
    )
  }

  return (
    <Section>
      <Container>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
              Your bag
            </h1>
            {!isLoading && count > 0 && (
              <p className="mt-1.5 text-sm text-ink-muted">{pluralize(count, 'item')}</p>
            )}
          </div>

          {!isLoading && items.length > 0 && (
            <button
              type="button"
              onClick={() => setConfirmClear(true)}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-muted transition-colors hover:text-rose-600"
            >
              <Trash2 className="h-4 w-4" aria-hidden />
              Empty bag
            </button>
          )}
        </div>

        {isLoading ? (
          <div className="mt-8 space-y-4">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="flex gap-4 rounded-2xl border border-zinc-200 p-5">
                <div className="h-24 w-24 animate-pulse rounded-xl bg-zinc-100" />
                <div className="flex-1 space-y-2 py-1">
                  <div className="h-4 w-2/3 animate-pulse rounded bg-zinc-100" />
                  <div className="h-3 w-1/4 animate-pulse rounded bg-zinc-100" />
                </div>
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <EmptyState
            className="mt-10"
            icon={<ShoppingBag className="h-5 w-5 text-ink-faint" aria-hidden />}
            title="Your bag is empty"
            description="Once you add something, it will show up here with live totals."
            action={<ButtonLink to={ROUTES.products}>Start shopping</ButtonLink>}
          />
        ) : (
          <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px] lg:gap-10">
            <div className="min-w-0">
              {hasUnavailableItems && (
                <Alert variant="warning" className="mb-4">
                  Some items are no longer available in the requested quantity. Adjust or
                  remove them to continue.
                </Alert>
              )}

              <ul className="divide-y divide-zinc-100 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-card">
                {items.map((item) => (
                  <CartItemRow
                    key={item.id}
                    item={item}
                    isUpdating={updatePending}
                    isRemoving={removePending}
                    onUpdate={(quantity) => void updateItem({ itemId: item.id, quantity })}
                    onRemove={() => void removeItem(item.id)}
                  />
                ))}
              </ul>

              <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
                <Link
                  to={ROUTES.products}
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-700 hover:underline"
                >
                  Continue shopping
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </Link>
              </div>
            </div>

            <div className="lg:sticky lg:top-28 lg:self-start">
              <CartSummary
                cart={cart!}
                checkoutButton={
                  <ButtonLink
                    to={ROUTES.checkout}
                    size="lg"
                    fullWidth
                    className={hasUnavailableItems ? 'pointer-events-none opacity-50' : undefined}
                    aria-disabled={hasUnavailableItems || undefined}
                    leftIcon={<Lock className="h-4 w-4" aria-hidden />}
                  >
                    Proceed to checkout
                  </ButtonLink>
                }
                footerNote={
                  <span className="inline-flex items-center gap-1.5">
                    <Lock className="h-3 w-3" aria-hidden />
                    Secure checkout — prices are confirmed server-side
                  </span>
                }
              />
            </div>
          </div>
        )}
      </Container>

      <ConfirmDialog
        open={confirmClear}
        title="Empty your bag?"
        description="Every item will be removed. This cannot be undone."
        confirmLabel="Empty bag"
        variant="danger"
        isLoading={clearPending}
        onCancel={() => setConfirmClear(false)}
        onConfirm={() => {
          setConfirmClear(false)
          void clearCart()
        }}
      />
    </Section>
  )
}
