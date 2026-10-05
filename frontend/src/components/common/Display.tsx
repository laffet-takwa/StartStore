import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

/* -------------------------------------------------------------------------- */
/* Card                                                                         */
/* -------------------------------------------------------------------------- */

export interface CardProps {
  children: ReactNode
  className?: string
  /** Adds a hover lift. Use for anything clickable. */
  interactive?: boolean
  as?: 'div' | 'section' | 'article' | 'li'
}

export function Card({ children, className, interactive, as: Tag = 'div' }: CardProps) {
  return (
    <Tag
      className={cn(
        'rounded-2xl border border-zinc-200/80 bg-white shadow-card transition-all duration-200 ease-spring',
        interactive && 'hover:-translate-y-0.5 hover:border-zinc-300 hover:shadow-card-hover',
        className,
      )}
    >
      {children}
    </Tag>
  )
}

export function CardHeader({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('border-b border-zinc-100 px-5 py-4', className)}>{children}</div>
}

export function CardBody({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('px-5 py-5', className)}>{children}</div>
}

export function CardFooter({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('border-t border-zinc-100 bg-surface px-5 py-4', className)}>{children}</div>
  )
}

/* -------------------------------------------------------------------------- */
/* Badge                                                                        */
/* -------------------------------------------------------------------------- */

export type BadgeVariant =
  | 'neutral'
  | 'brand'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'outline'

const BADGE_VARIANTS: Record<BadgeVariant, string> = {
  neutral: 'bg-zinc-100 text-ink-soft ring-zinc-500/15',
  brand: 'bg-brand-50 text-brand-700 ring-brand-600/15',
  success: 'bg-emerald-50 text-emerald-700 ring-emerald-600/15',
  warning: 'bg-amber-50 text-amber-800 ring-amber-600/20',
  danger: 'bg-rose-50 text-rose-700 ring-rose-600/15',
  info: 'bg-blue-50 text-blue-700 ring-blue-600/15',
  outline: 'bg-white text-ink-soft ring-zinc-300',
}

export interface BadgeProps {
  children: ReactNode
  variant?: BadgeVariant
  className?: string
  size?: 'sm' | 'md'
}

export function Badge({ children, variant = 'neutral', className, size = 'sm' }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full font-medium ring-1 ring-inset',
        size === 'sm' ? 'px-2.5 py-0.5 text-2xs' : 'px-3 py-1 text-xs',
        BADGE_VARIANTS[variant],
        className,
      )}
    >
      {children}
    </span>
  )
}

/* -------------------------------------------------------------------------- */
/* Price                                                                        */
/* -------------------------------------------------------------------------- */

/**
 * Price block. The strikethrough figure and the saving badge only render when the
 * product is genuinely discounted, so nothing misleading appears on full-price
 * items.
 */
export function PriceBlock({
  price,
  discountPrice,
  finalPrice,
  discountPercentage,
  size = 'md',
  className,
}: {
  price: string
  discountPrice?: string | null
  finalPrice: string
  discountPercentage?: number
  size?: 'sm' | 'md' | 'lg'
  className?: string
}) {
  const discounted = Boolean(discountPrice) && Number(discountPrice) < Number(price)
  const saved = discountPercentage ?? 0

  const sizes = {
    sm: { now: 'text-sm', was: 'text-xs', badge: 'text-2xs' },
    md: { now: 'text-lg', was: 'text-sm', badge: 'text-2xs' },
    lg: { now: 'text-3xl', was: 'text-base', badge: 'text-xs' },
  }[size]

  return (
    <div className={cn('flex flex-wrap items-baseline gap-x-2 gap-y-1', className)}>
      <span className={cn('font-semibold tracking-tight text-ink', sizes.now)}>
        <Price value={finalPrice} />
      </span>
      {discounted && (
        <>
          <span className={cn('text-ink-faint line-through', sizes.was)}>
            <Price value={price} />
          </span>
          {saved > 0 && (
            <span className={cn('font-semibold text-emerald-600', sizes.badge)}>
              −{saved}%
            </span>
          )}
        </>
      )}
    </div>
  )
}

/** Formats a decimal string as currency. Split out so it can be reused alone. */
export function Price({ value, className }: { value: string | number; className?: string }) {
  return <CurrencyAmount value={value} className={className} />
}

let currencyFormatter: Intl.NumberFormat | null = null
let formatterCurrency = ''

function getFormatter(currency: string): Intl.NumberFormat {
  if (!currencyFormatter || formatterCurrency !== currency) {
    currencyFormatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
    formatterCurrency = currency
  }
  return currencyFormatter
}

function CurrencyAmount({ value, className }: { value: string | number; className?: string }) {
  const currency = currencyCode()
  const amount = typeof value === 'number' ? value : Number.parseFloat(value)
  const formatted = Number.isNaN(amount)
    ? getFormatter(currency).format(0)
    : getFormatter(currency).format(amount)
  return <span className={className}>{formatted}</span>
}

function currencyCode(): string {
  // Kept as a function so the env read happens once at render time.
  return import.meta.env.VITE_CURRENCY?.trim() || 'USD'
}

/* -------------------------------------------------------------------------- */
/* Stock                                                                        */
/* -------------------------------------------------------------------------- */

export function StockBadge({
  stock,
  threshold = 5,
  className,
}: {
  stock: number
  threshold?: number
  className?: string
}) {
  if (stock <= 0) {
    return (
      <span className={cn('text-xs font-medium text-zinc-500', className)}>Out of stock</span>
    )
  }
  if (stock <= threshold) {
    return (
      <span className={cn('text-xs font-medium text-amber-600', className)}>
        Only {stock} left
      </span>
    )
  }
  return (
    <span className={cn('text-xs font-medium text-emerald-600', className)}>In stock</span>
  )
}

/* -------------------------------------------------------------------------- */
/* Avatar                                                                       */
/* -------------------------------------------------------------------------- */

export function Avatar({
  src,
  name,
  size = 36,
  className,
}: {
  src?: string | null
  name: string | null | undefined
  size?: number
  className?: string
}) {
  const label = (name ?? '').trim()
  const parts = label ? label.split(/\s+/).slice(0, 2) : []
  const initials = parts.map((part) => part[0]?.toUpperCase() ?? '').join('') || '?'

  if (src) {
    return (
      <img
        src={src}
        alt=""
        width={size}
        height={size}
        className={cn('shrink-0 rounded-full object-cover ring-1 ring-zinc-200', className)}
        style={{ width: size, height: size }}
      />
    )
  }

  return (
    <span
      aria-hidden
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full bg-brand-100 font-semibold text-brand-700',
        className,
      )}
      style={{ width: size, height: size, fontSize: size * 0.36 }}
    >
      {initials}
    </span>
  )
}

/* -------------------------------------------------------------------------- */
/* Rating (decorative)                                                          */
/* -------------------------------------------------------------------------- */

export function Rating({
  value = 4.5,
  count,
  className,
}: {
  value?: number
  count?: number
  className?: string
}) {
  const full = Math.floor(value)
  const hasHalf = value - full >= 0.25 && value - full < 0.75
  const roundedUp = value - full >= 0.75

  return (
    <span className={cn('inline-flex items-center gap-1.5', className)}>
      <span className="inline-flex" aria-hidden>
        {Array.from({ length: 5 }).map((_, index) => {
          const filled = index < full || (index === full && (hasHalf || roundedUp))
          return (
            <svg
              key={index}
              viewBox="0 0 20 20"
              className={cn('h-3.5 w-3.5', filled ? 'text-amber-400' : 'text-zinc-200')}
              fill="currentColor"
            >
              <path d="M10 1.5l2.6 5.27 5.82.85-4.21 4.1.99 5.79L10 14.8l-5.2 2.73.99-5.79-4.21-4.1 5.82-.85L10 1.5z" />
            </svg>
          )
        })}
      </span>
      <span className="text-xs text-ink-muted">
        {value.toFixed(1)}
        {count !== undefined && ` (${count})`}
      </span>
    </span>
  )
}

/* -------------------------------------------------------------------------- */
/* Tabs                                                                         */
/* -------------------------------------------------------------------------- */

export interface TabItem {
  id: string
  label: string
}

export function Tabs({
  tabs,
  active,
  onChange,
  className,
}: {
  tabs: TabItem[]
  active: string
  onChange: (id: string) => void
  className?: string
}) {
  return (
    <div className={cn('flex gap-1 overflow-x-auto border-b border-zinc-200', className)} role="tablist">
      {tabs.map((tab) => {
        const isActive = tab.id === active
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.id)}
            className={cn(
              'relative whitespace-nowrap px-4 py-2.5 text-sm font-medium transition-colors',
              isActive ? 'text-brand-700' : 'text-ink-muted hover:text-ink',
            )}
          >
            {tab.label}
            {isActive && (
              <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-brand-600" />
            )}
          </button>
        )
      })}
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* Quantity                                                                     */
/* -------------------------------------------------------------------------- */

export function QuantityStepper({
  value,
  min = 1,
  max = 99,
  onChange,
  disabled,
  size = 'md',
  className,
}: {
  value: number
  min?: number
  max?: number
  onChange: (next: number) => void
  disabled?: boolean
  size?: 'sm' | 'md'
  className?: string
}) {
  const clamp = (next: number) => Math.min(Math.max(next, min), max)
  const buttonClass =
    'flex items-center justify-center text-ink-soft transition-colors hover:bg-zinc-100 hover:text-ink disabled:cursor-not-allowed disabled:text-zinc-300'
  const dimensions = size === 'sm' ? 'h-9 w-9' : 'h-11 w-11'
  const valueClass = size === 'sm' ? 'w-9 text-sm' : 'w-12 text-sm'

  return (
    <div
      className={cn(
        'inline-flex items-center overflow-hidden rounded-xl border border-zinc-300 bg-white',
        className,
      )}
    >
      <button
        type="button"
        aria-label="Decrease quantity"
        disabled={disabled || value <= min}
        onClick={() => onChange(clamp(value - 1))}
        className={cn(dimensions, buttonClass)}
      >
        <span className="text-lg leading-none">−</span>
      </button>
      <span
        className={cn(valueClass, 'text-center font-medium tabular-nums text-ink')}
        aria-live="polite"
      >
        {value}
      </span>
      <button
        type="button"
        aria-label="Increase quantity"
        disabled={disabled || value >= max}
        onClick={() => onChange(clamp(value + 1))}
        className={cn(dimensions, buttonClass)}
      >
        <span className="text-lg leading-none">+</span>
      </button>
    </div>
  )
}
