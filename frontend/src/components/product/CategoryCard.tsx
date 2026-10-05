import { Link } from 'react-router-dom'
import { ArrowRight, LayoutGrid } from 'lucide-react'

import { ProductImage } from './ProductCard'
import { cn } from '@/lib/cn'
import type { Category } from '@/types'
import { ROUTES } from '@/utils/constants'

/**
 * Category tile.
 *
 * Falls back to a deterministic gradient keyed on the id, so a category without
 * an image still gets a distinct, deliberate-looking tile rather than a grey box.
 */
export function CategoryCard({
  category,
  className,
}: {
  category: Category
  className?: string
}) {
  return (
    <Link
      to={`${ROUTES.products}?category=${category.slug ?? category.id}`}
      className={cn(
        'group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-card',
        'transition-all duration-200 ease-spring hover:-translate-y-1 hover:border-zinc-300 hover:shadow-card-hover',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2',
        className,
      )}
    >
      {category.image_url ? (
        <ProductImage
          src={category.image_url}
          alt={category.name}
          ratio="aspect-[4/3]"
          className="mb-4 w-full rounded-xl transition-transform duration-500 ease-spring group-hover:scale-[1.03]"
        />
      ) : (
        <div
          className={cn(
            'mb-4 flex aspect-[4/3] w-full items-center justify-center rounded-xl',
            gradientFor(category.id),
          )}
        >
          <LayoutGrid className="h-6 w-6 text-white/80" aria-hidden />
        </div>
      )}

      <div className="flex items-end justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-sm font-semibold text-ink group-hover:text-brand-700">
            {category.name}
          </h3>
          {category.description && (
            <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-ink-muted">
              {category.description}
            </p>
          )}
          {typeof category.product_count === 'number' && (
            <p className="mt-1.5 text-2xs font-medium text-ink-faint">
              {category.product_count} product{category.product_count === 1 ? '' : 's'}
            </p>
          )}
        </div>
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-ink-soft transition-all duration-200 group-hover:bg-ink group-hover:text-white">
          <ArrowRight className="h-4 w-4 -rotate-45 transition-transform duration-200 group-hover:rotate-0" />
        </span>
      </div>
    </Link>
  )
}

/** Six-hue rotation, so adjacent categories never look identical. */
function gradientFor(seed: string): string {
  const gradients = [
    'bg-gradient-to-br from-brand-500 to-brand-700',
    'bg-gradient-to-br from-emerald-500 to-teal-700',
    'bg-gradient-to-br from-amber-500 to-orange-600',
    'bg-gradient-to-br from-rose-500 to-pink-700',
    'bg-gradient-to-br from-sky-500 to-indigo-700',
    'bg-gradient-to-br from-violet-500 to-purple-700',
  ]
  let hash = 0
  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 31 + seed.charCodeAt(index)) >>> 0
  }
  return gradients[hash % gradients.length]
}
