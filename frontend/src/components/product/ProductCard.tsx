import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Heart, ImageOff, ShoppingCart } from 'lucide-react'

import { Badge, PriceBlock, StockBadge } from '@/components/common/Display'
import { IconButton } from '@/components/common/Button'
import { useCartMutations } from '@/hooks/useCart'
import { useWishlistToggle } from '@/hooks/useWishlist'
import { cn } from '@/lib/cn'
import type { Product } from '@/types'
import { ROUTES } from '@/utils/constants'

/* -------------------------------------------------------------------------- */
/* Image                                                                        */
/* -------------------------------------------------------------------------- */

/**
 * Product image with a graceful placeholder.
 *
 * Catalogue images are arbitrary customer URLs, so a missing or broken file has
 * to degrade to something that still looks deliberate.
 */
export function ProductImage({
  src,
  alt,
  className,
  sizes,
  ratio = 'aspect-square',
}: {
  src: string | null | undefined
  alt: string
  className?: string
  sizes?: string
  /** Any Tailwind aspect utility, e.g. `aspect-[4/3]`. */
  ratio?: string
}) {
  const [failed, setFailed] = useState(false)

  if (!src || failed) {
    return (
      <div
        className={cn(
          'flex items-center justify-center bg-gradient-to-br from-zinc-50 to-zinc-100',
          ratio,
          className,
        )}
        role="img"
        aria-label={alt}
      >
        <ImageOff className="h-8 w-8 text-zinc-300" aria-hidden />
      </div>
    )
  }

  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      decoding="async"
      sizes={sizes ?? '(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw'}
      onError={() => setFailed(true)}
      className={cn('bg-zinc-50 object-cover', ratio, className)}
    />
  )
}

/** Chooses the best available image: primary, then the first gallery entry. */
export function primaryImageOf(product: {
  image_url: string | null
  images?: { image_url: string }[]
}): string | null {
  if (product.image_url) return product.image_url
  const first = product.images?.[0]?.image_url
  return first ?? null
}

/* -------------------------------------------------------------------------- */
/* Wishlist                                                                     */
/* -------------------------------------------------------------------------- */

export function WishlistButton({
  productId,
  className,
  size = 'md',
}: {
  productId: string
  className?: string
  size?: 'sm' | 'md'
}) {
  const { isSaved, toggle } = useWishlistToggle()
  const saved = isSaved(productId)

  return (
    <IconButton
      label={saved ? 'Remove from wishlist' : 'Save to wishlist'}
      aria-pressed={saved}
      onClick={(event) => {
        // Cards are links; do not navigate when the heart is tapped.
        event.preventDefault()
        event.stopPropagation()
        toggle(productId)
      }}
      className={cn(
        'bg-white/90 backdrop-blur-sm hover:bg-white',
        saved && 'text-rose-600 hover:text-rose-700',
        className,
      )}
    >
      <Heart
        className={cn(size === 'sm' ? 'h-3.5 w-3.5' : 'h-4.5 w-4.5', saved && 'fill-current')}
        strokeWidth={1.9}
      />
    </IconButton>
  )
}

/* -------------------------------------------------------------------------- */
/* Card                                                                         */
/* -------------------------------------------------------------------------- */

export function ProductCard({
  product,
  className,
}: {
  product: Product
  className?: string
}) {
  const { addItem, addPending } = useCartMutations()
  const inStock = product.in_stock

  return (
    <Link
      to={ROUTES.product(product.id)}
      className={cn(
        'group relative flex flex-col overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-card',
        'transition-all duration-200 ease-spring hover:-translate-y-1 hover:border-zinc-300 hover:shadow-card-hover',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2',
        className,
      )}
    >
      <div className="relative overflow-hidden">
        <ProductImage
          src={primaryImageOf(product)}
          alt={product.name}
          ratio="aspect-square"
          className="w-full transition-transform duration-500 ease-spring group-hover:scale-[1.04]"
        />

        <div className="absolute left-3 top-3 flex flex-col items-start gap-1.5">
          {product.is_on_sale && product.discount_percentage > 0 && (
            <Badge variant="danger" className="shadow-sm">
              −{product.discount_percentage}%
            </Badge>
          )}
          {!inStock && <Badge variant="neutral">Sold out</Badge>}
        </div>

        <div className="absolute right-2 top-2 opacity-0 transition-opacity duration-200 focus-within:opacity-100 group-hover:opacity-100">
          <WishlistButton productId={product.id} size="sm" />
        </div>
      </div>

      <div className="flex flex-1 flex-col p-4">
        {product.category && (
          <p className="mb-1.5 text-2xs font-semibold uppercase tracking-[0.1em] text-ink-faint">
            {product.category.name}
          </p>
        )}

        <h3 className="line-clamp-2 text-sm font-medium leading-snug text-ink group-hover:text-brand-700">
          {product.name}
        </h3>

        <div className="mt-auto pt-3">
          <PriceBlock
            price={product.price}
            discountPrice={product.discount_price}
            finalPrice={product.final_price}
            discountPercentage={product.discount_percentage}
            size="sm"
          />
          <div className="mt-1.5">
            <StockBadge stock={product.stock} />
          </div>
        </div>
      </div>

      {/* Quick add, revealed on hover on pointer devices. */}
      {inStock && (
        <button
          type="button"
          disabled={addPending}
          onClick={(event) => {
            event.preventDefault()
            event.stopPropagation()
            void addItem({ product_id: product.id, quantity: 1 })
          }}
          className={cn(
            'absolute inset-x-3 bottom-3 flex h-10 translate-y-2 items-center justify-center gap-2 rounded-xl',
            'bg-ink text-sm font-medium text-white opacity-0 shadow-card-hover',
            'transition-all duration-200 ease-spring hover:bg-ink-soft',
            'group-hover:translate-y-0 group-hover:opacity-100 focus-visible:translate-y-0 focus-visible:opacity-100',
            'disabled:pointer-events-none disabled:opacity-60',
          )}
        >
          <ShoppingCart className="h-4 w-4" aria-hidden />
          Add to bag
        </button>
      )}
    </Link>
  )
}

/* -------------------------------------------------------------------------- */
/* Grid                                                                         */
/* -------------------------------------------------------------------------- */

export function ProductGrid({
  products,
  className,
  columns = 4,
}: {
  products: Product[]
  className?: string
  columns?: 3 | 4
}) {
  const gridClass =
    columns === 3
      ? 'grid-cols-2 lg:grid-cols-3'
      : 'grid-cols-2 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4'

  return (
    <div className={cn('grid gap-4', gridClass, className)}>
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  )
}
