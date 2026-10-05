import { useState } from 'react'
import { Heart, ShoppingBag, Trash2 } from 'lucide-react'

import { Button, ButtonLink } from '@/components/common'
import { Alert, EmptyState, ProductGridSkeleton } from '@/components/common/Feedback'
import { ConfirmDialog } from '@/components/common/Overlay'
import { PriceBlock } from '@/components/common/Display'
import { ProductImage, WishlistButton, primaryImageOf } from '@/components/product/ProductCard'
import { Container, Section } from '@/components/layout/Primitives'
import { useCartMutations } from '@/hooks/useCart'
import { useRemoveFromWishlist, useWishlist } from '@/hooks/useWishlist'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import type { WishlistEntry } from '@/types'
import { discountPercent, pluralize } from '@/utils/format'
import { ROUTES } from '@/utils/constants'

/** `ProductSummary` has no `is_on_sale`, so derive the saving from the prices. */
function savingPercent(price: string, finalPrice: string): number {
  return discountPercent(price, finalPrice === price ? null : finalPrice)
}

export default function WishlistPage() {
  useDocumentTitle('Your wishlist — StartStore')

  const { entries, count, isLoading, isError, error, refetch } = useWishlist()
  const { mutate: removeFromWishlist, isPending: isRemoving } = useRemoveFromWishlist()
  const { addItem, addPending } = useCartMutations()
  const [pendingId, setPendingId] = useState<string | null>(null)

  const inStockCount = entries.filter((entry) => entry.product.in_stock).length

  return (
    <Section>
      <Container>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
              Your wishlist
            </h1>
            {!isLoading && count > 0 && (
              <p className="mt-1.5 text-sm text-ink-muted">
                {pluralize(count, 'saved item')} · {pluralize(inStockCount, 'in stock')}
              </p>
            )}
          </div>

          {count > 0 && (
            <ButtonLink to={ROUTES.products} variant="outline" size="sm">
              Browse more
            </ButtonLink>
          )}
        </div>

        {isError && (
          <Alert
            variant="danger"
            className="mt-8"
            title="We could not load your wishlist"
            action={
              <Button size="sm" variant="outline" onClick={() => void refetch()}>
                Retry
              </Button>
            }
          >
            {error instanceof Error ? error.message : 'Please try again.'}
          </Alert>
        )}

        {isLoading ? (
          <div className="mt-8">
            <ProductGridSkeleton count={4} />
          </div>
        ) : entries.length === 0 ? (
          <EmptyState
            className="mt-10"
            icon={<Heart className="h-5 w-5 text-ink-faint" aria-hidden />}
            title="Nothing saved yet"
            description="Tap the heart on any product to keep it here for later."
            action={<ButtonLink to={ROUTES.products}>Find something you like</ButtonLink>}
          />
        ) : (
          <ul className="mt-8 divide-y divide-zinc-100 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-card">
            {entries.map((entry) => (
              <WishlistRow
                key={entry.id}
                entry={entry}
                busy={addPending && pendingId === entry.product.id}
                onAddToCart={async () => {
                  setPendingId(entry.product.id)
                  try {
                    await addItem({ product_id: entry.product.id, quantity: 1 })
                  } finally {
                    setPendingId(null)
                  }
                }}
                onRemove={() => {
                  setPendingId(entry.product.id)
                  removeFromWishlist(entry.product.id)
                }}
                removing={isRemoving && pendingId === entry.product.id}              />
            ))}
          </ul>
        )}
      </Container>
    </Section>
  )
}

function WishlistRow({
  entry,
  busy,
  removing,
  onAddToCart,
  onRemove,
}: {
  entry: WishlistEntry
  busy: boolean
  removing?: boolean
  onAddToCart: () => Promise<void>
  onRemove: () => void
}) {  const [confirm, setConfirm] = useState(false)
  const { product } = entry

  return (
    <>
      <li className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
        <div className="flex flex-1 items-center gap-4">
          <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-zinc-200">
            <ProductImage
              src={primaryImageOf(product)}
              alt={product.name}
              ratio="aspect-square"
              className="h-full w-full"
              sizes="80px"
            />
          </div>

          <div className="min-w-0 flex-1">
            <p className="line-clamp-2 text-sm font-medium text-ink">{product.name}</p>
            {product.category_name && (
              <p className="mt-0.5 text-2xs uppercase tracking-wide text-ink-faint">
                {product.category_name}
              </p>
            )}
            <PriceBlock
              className="mt-1.5"
              price={product.price}
              discountPrice={product.discount_price}
              finalPrice={product.final_price}
              discountPercentage={savingPercent(product.price, product.final_price)}
              size="sm"
            />
            {!product.in_stock && (
              <p className="mt-1 text-2xs font-medium text-amber-600">
                Currently out of stock
              </p>
            )}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            leftIcon={<ShoppingBag className="h-4 w-4" />}
            disabled={!product.in_stock}
            isLoading={busy}
            onClick={() => void onAddToCart()}
          >
            {product.in_stock ? 'Move to bag' : 'Sold out'}
          </Button>
          <WishlistButton productId={product.id} size="sm" />
          <Button
            size="sm"
            variant="ghost"
            aria-label={`Remove ${product.name} from wishlist`}
            disabled={removing}
            onClick={() => setConfirm(true)}
            className="text-ink-faint hover:text-rose-600"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </li>

      <ConfirmDialog
        open={confirm}
        title="Remove from wishlist?"
        description={`${product.name} will no longer be saved.`}
        confirmLabel="Remove"
        variant="danger"
        onCancel={() => setConfirm(false)}
        onConfirm={() => {
          setConfirm(false)
          onRemove()
        }}
      />
    </>
  )
}
