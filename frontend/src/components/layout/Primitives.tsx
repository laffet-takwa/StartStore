import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

import { cn } from '@/lib/cn'

export function Container({
  children,
  className,
  size = 'default',
}: {
  children: ReactNode
  className?: string
  size?: 'default' | 'wide' | 'narrow'
}) {
  const widths = {
    default: 'max-w-7xl',
    wide: 'max-w-[100rem]',
    narrow: 'max-w-3xl',
  } as const

  return (
    <div className={cn('mx-auto w-full px-4 sm:px-6 lg:px-8', widths[size], className)}>
      {children}
    </div>
  )
}

export function Section({
  children,
  className,
  id,
}: {
  children: ReactNode
  className?: string
  id?: string
}) {
  return (
    <section id={id} className={cn('py-12 sm:py-16 lg:py-20', className)}>
      {children}
    </section>
  )
}

/** Section title + optional action, used at the top of every home band. */
export function SectionHeading({
  eyebrow,
  title,
  description,
  action,
  align = 'left',
  className,
}: {
  eyebrow?: string
  title: string
  description?: string
  action?: ReactNode
  align?: 'left' | 'center'
  className?: string
}) {
  return (
    <div
      className={cn(
        'mb-8 flex flex-col gap-4 sm:mb-10 sm:flex-row sm:items-end sm:justify-between',
        align === 'center' && 'sm:flex-col sm:items-center sm:text-center',
        className,
      )}
    >
      <div className={cn('max-w-2xl', align === 'center' && 'mx-auto')}>
        {eyebrow && (
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-brand-600">
            {eyebrow}
          </p>
        )}
        <h2 className="text-2xl font-semibold tracking-tight text-ink sm:text-3xl">{title}</h2>
        {description && (
          <p className="mt-2 text-[0.9375rem] leading-relaxed text-ink-muted">{description}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}

/** Breadcrumb trail; the last entry is the current page and is not a link. */
export function Breadcrumbs({
  items,
  className,
}: {
  items: { label: string; to?: string }[]
  className?: string
}) {
  return (
    <nav aria-label="Breadcrumb" className={cn('flex items-center gap-1.5 text-sm', className)}>
      {items.map((item, index) => {
        const isLast = index === items.length - 1
        return (
          <span key={`${item.label}-${index}`} className="flex items-center gap-1.5">
            {index > 0 && <span className="text-zinc-300">/</span>}
            {item.to && !isLast ? (
              <Link
                to={item.to}
                className="text-ink-muted transition-colors hover:text-ink"
              >
                {item.label}
              </Link>
            ) : (
              <span className={cn(isLast ? 'font-medium text-ink' : 'text-ink-muted')}>
                {item.label}
              </span>
            )}
          </span>
        )
      })}
    </nav>
  )
}

/** Soft gradient panel used for the promo band and hero accent areas. */
export function Panel({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-50 via-white to-brand-50/60',
        className,
      )}
    >
      {children}
    </div>
  )
}
