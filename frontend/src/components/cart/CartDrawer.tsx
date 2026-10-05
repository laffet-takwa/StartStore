import { useNavigate } from 'react-router-dom'
import { ShoppingBag } from 'lucide-react'

import { Button } from '@/components/common/Button'
import { EmptyState } from '@/components/common/Feedback'
import { Drawer } from '@/components/common/Overlay'
import { CartItemRow } from './CartItemRow'
import { CartSummaryInline } from './CartSummary'
import { useCart, useCartMutations } from '@/hooks/useCart'
import { useCartUiStore } from '@/store/cartStore'
import { ROUTES } from '@/utils/constants'

/**
 * Slide-over bag.
 *
 * Add-to-cart opens this so the confirmation is visible without navigating; the
 * customer can close it and keep browsing.
 */
export function CartDrawer() {
  const isOpen = useCartUiStore((state) => state.isDrawerOpen)
  const close = useCartUiStore((state) => state.closeDrawer)
  const lastAddedProductId = useCartUiStore((state) => state.lastAddedProductId)

  const { cart, items, isLoading } = useCart()
  const { updateItem, removeItem, updatePending, removePending } = useCartMutations()
  const navigate = useNavigate()

  const goTo = (path: string) => {
    close()
    navigate(path)
  }

  return (
    <Drawer
      open={isOpen}
      onClose={close}
      title={
        <div className="flex items-center gap-2">
          <ShoppingBag className="h-4.5 w-4.5 text-ink" aria-hidden />
          <span className="text-base font-semibold tracking-tight text-ink">
            Your bag
            {items.length > 0 && (
              <span className="ml-1.5 text-sm font-normal text-ink-muted">
                {items.length} item{items.length === 1 ? '' : 's'}
              </span>
            )}
          </span>
        </div>
      }
      footer={
        cart && items.length > 0 ? (
          <div className="space-y-3">
            <CartSummaryInline cart={cart} />
            <Button fullWidth size="lg" onClick={() => goTo(ROUTES.checkout)}>
              Checkout
            </Button>
            <Button variant="ghost" size="sm" fullWidth onClick={() => goTo(ROUTES.cart)}>
              View full bag
            </Button>
          </div>
        ) : null
      }
    >
      {isLoading && (
        <div className="space-y-4 p-5">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="flex gap-4">
              <div className="h-20 w-20 animate-pulse rounded-xl bg-zinc-100" />
              <div className="flex-1 space-y-2">
                <div className="h-3.5 w-3/4 animate-pulse rounded bg-zinc-100" />
                <div className="h-3 w-1/3 animate-pulse rounded bg-zinc-100" />
              </div>
            </div>
          ))}
        </div>
      )}

      {!isLoading && items.length === 0 && (
        <div className="p-5">
          <EmptyState
            compact
            icon={<ShoppingBag className="h-5 w-5 text-ink-faint" aria-hidden />}
            title="Your bag is empty"
            description="Once you add something, it will show up here."
            action={<Button onClick={() => goTo(ROUTES.products)}>Start shopping</Button>}
          />
        </div>
      )}

      {items.length > 0 && (
        <ul className="divide-y divide-zinc-100">
          {items.map((item) => (
            <CartItemRow
              key={item.id}
              item={item}
              compact
              highlight={item.product.id === lastAddedProductId}
              isUpdating={updatePending}
              isRemoving={removePending && item.product.id === lastAddedProductId}
              onUpdate={(quantity) => void updateItem({ itemId: item.id, quantity })}
              onRemove={() => void removeItem(item.id)}
            />
          ))}
        </ul>
      )}
    </Drawer>
  )
}
