import { Trash2 } from 'lucide-react'

import { IconButton } from '@/components/common/Button'
import { Price } from '@/components/common/Display'
import { QuantityStepper } from '@/components/common/Display'
import { Link } from 'react-router-dom'

import { ProductImage, primaryImageOf } from '@/components/product/ProductCard'
import { cn } from '@/lib/cn'
import type { CartItem } from '@/types'
import { formatNumber } from '@/utils/format'
import { ROUTES } from '@/utils/constants'

/**
 * A single cart line.
 *
 * Rows whose product was deactivated or whose stock dropped below the quantity
 * are called out explicitly rather than silently showing a total that cannot be
 * bought.
 */
export function CartItemRow({
  item,
  onUpdate,
  onRemove,
  isUpdating,
  isRemoving,
  highlight,
  compact,
  className,
}: {
  item: CartItem
  onUpdate: (quantity: number) => void
  onRemove: () => void
  isUpdating?: boolean
  isRemoving?: boolean
  highlight?: boolean
  compact?: boolean
  className?: string
}) {
  const blocked = !item.is_available

  return (
    <li
      className={cn(
        'flex gap-4 px-4 py-4 transition-colors sm:px-5',
        highlight && 'bg-brand-50/40',
        blocked && 'bg-rose-50/30',
        className,
      )}
    >
      <Link
        to={ROUTES.product(item.product.id)}
        className={cn(
          'shrink-0 overflow-hidden rounded-xl border border-zinc-200 bg-white',
          compact ? 'h-16 w-16' : 'h-20 w-20 sm:h-24 sm:w-24',
        )}
      >
        <ProductImage
          src={primaryImageOf(item.product)}
          alt={item.product.name}
          ratio="aspect-square"
          className="h-full w-full"
          sizes="96px"
        />
      </Link>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <Link
              to={ROUTES.product(item.product.id)}
              className="line-clamp-2 text-sm font-medium text-ink transition-colors hover:text-brand-700"
            >
              {item.product.name}
            </Link>
            {item.product.sku && (
              <p className="mt-0.5 text-2xs text-ink-faint">SKU {item.product.sku}</p>
            )}
            <p className="mt-1 text-sm font-medium text-ink">
              <Price value={item.unit_price} />
            </p>
          </div>

          <IconButton
            label={`Remove ${item.product.name}`}
            size="sm"
            disabled={isRemoving}
            onClick={onRemove}
            className="-mr-1 -mt-1 shrink-0 text-ink-faint hover:text-rose-600"
          >
            <Trash2 className="h-4 w-4" />
          </IconButton>
        </div>

        {blocked && (
          <p className="mt-1.5 text-2xs font-medium text-rose-600">
            {item.product.stock <= 0
              ? 'Out of stock — remove this item to check out.'
              : `Only ${formatNumber(item.available_quantity)} left — reduce the quantity to continue.`}
          </p>
        )}

        <div className="mt-auto flex items-center justify-between gap-3 pt-3">
          <QuantityStepper
            size="sm"
            value={item.quantity}
            min={1}
            max={Math.max(item.available_quantity, item.quantity)}
            disabled={isUpdating || blocked}
            onChange={(next) => onUpdate(next)}
          />
          <p className="text-sm font-semibold tabular-nums text-ink">
            <Price value={item.line_total} />
          </p>
        </div>
      </div>
    </li>
  )
}
