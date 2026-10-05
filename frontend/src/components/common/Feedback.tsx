import type { ReactNode } from 'react'
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Info,
  PackageOpen,
  RefreshCw,
  SearchX,
  ShieldAlert,
} from 'lucide-react'

import { cn } from '@/lib/cn'
import { Button } from './Button'

/* -------------------------------------------------------------------------- */
/* Alert                                                                        */
/* -------------------------------------------------------------------------- */

const ALERT_STYLES = {
  info: { wrap: 'bg-brand-50 text-brand-800 ring-brand-600/15', icon: Info },
  success: { wrap: 'bg-emerald-50 text-emerald-800 ring-emerald-600/15', icon: CheckCircle2 },
  warning: { wrap: 'bg-amber-50 text-amber-900 ring-amber-600/20', icon: AlertTriangle },
  danger: { wrap: 'bg-rose-50 text-rose-800 ring-rose-600/15', icon: ShieldAlert },
} as const

export interface AlertProps {
  variant?: keyof typeof ALERT_STYLES
  title?: string
  children?: ReactNode
  action?: ReactNode
  className?: string
}

export function Alert({ variant = 'info', title, children, action, className }: AlertProps) {
  const { wrap, icon: Icon } = ALERT_STYLES[variant]
  return (
    <div className={cn('flex gap-3 rounded-xl px-4 py-3 ring-1 ring-inset', wrap, className)}>
      <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
      <div className="min-w-0 flex-1 text-sm">
        {title && <p className="font-semibold">{title}</p>}
        {children && <div className={cn(title && 'mt-0.5', 'leading-relaxed')}>{children}</div>}
      </div>
      {action && <div className="shrink-0 self-center">{action}</div>}
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* Spinner                                                                      */
/* -------------------------------------------------------------------------- */

export function Spinner({ className }: { className?: string }) {
  return (
    <span
      role="status"
      aria-label="Loading"
      className={cn(
        'inline-block h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent',
        className,
      )}
    />
  )
}

/** Full-height loader for route-level pending states. */
export function PageLoader({ label = 'Loading' }: { label?: string }) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3" role="status">
      <Spinner className="h-7 w-7 text-brand-600" />
      <p className="text-sm text-ink-muted">{label}…</p>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* Skeletons                                                                    */
/* -------------------------------------------------------------------------- */

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-lg bg-zinc-200/70',
        'after:absolute after:inset-0 after:-translate-x-full after:animate-shimmer',
        'after:bg-gradient-to-r after:from-transparent after:via-white/60 after:to-transparent',
        className,
      )}
      aria-hidden
    />
  )
}

export function ProductCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-card">
      <Skeleton className="aspect-square w-full rounded-none" />
      <div className="space-y-2.5 p-4">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
        <div className="flex items-center justify-between pt-1">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-8 w-8 rounded-lg" />
        </div>
      </div>
    </div>
  )
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: count }).map((_, index) => (
        <ProductCardSkeleton key={index} />
      ))}
    </div>
  )
}

export function ProductDetailSkeleton() {
  return (
    <div className="grid gap-10 lg:grid-cols-2">
      <div className="space-y-3">
        <Skeleton className="aspect-square w-full rounded-2xl" />
        <div className="grid grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="aspect-square rounded-xl" />
          ))}
        </div>
      </div>
      <div className="space-y-4">
        <Skeleton className="h-9 w-3/4" />
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-12 w-full max-w-sm" />
        <Skeleton className="h-40 w-full" />
      </div>
    </div>
  )
}

export function TableSkeleton({ rows = 6, columns = 5 }: { rows?: number; columns?: number }) {
  return (
    <div className="divide-y divide-zinc-100">
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex items-center gap-4 px-5 py-4">
          {Array.from({ length: columns }).map((__, columnIndex) => (
            <Skeleton
              key={columnIndex}
              className={cn('h-4', columnIndex === 0 ? 'w-2/5' : 'flex-1')}
            />
          ))}
        </div>
      ))}
    </div>
  )
}

export function CardGridSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, index) => (
        <Skeleton key={index} className="h-32 rounded-2xl" />
      ))}
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* Empty + error states                                                         */
/* -------------------------------------------------------------------------- */

export interface EmptyStateProps {
  title: string
  description?: string
  icon?: ReactNode
  action?: ReactNode
  className?: string
  compact?: boolean
}

export function EmptyState({
  title,
  description,
  icon,
  action,
  className,
  compact,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-300 bg-surface text-center',
        compact ? 'px-6 py-10' : 'px-6 py-16',
        className,
      )}
    >
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-card">
        {icon ?? <PackageOpen className="h-5 w-5 text-ink-faint" aria-hidden />}
      </div>
      <h3 className="text-base font-semibold text-ink">{title}</h3>
      {description && (
        <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-ink-muted">{description}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

export interface ErrorStateProps {
  title?: string
  message: string
  onRetry?: () => void
  className?: string
}

/** Shown when a query fails; always offers a retry rather than a dead end. */
export function ErrorState({
  title = 'Something went wrong',
  message,
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-2xl border border-rose-200 bg-rose-50/50 px-6 py-14 text-center',
        className,
      )}
      role="alert"
    >
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-card">
        <AlertCircle className="h-5 w-5 text-rose-600" aria-hidden />
      </div>
      <h3 className="text-base font-semibold text-ink">{title}</h3>
      <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-ink-soft">{message}</p>
      {onRetry && (
        <Button variant="outline" className="mt-5" leftIcon={<RefreshCw className="h-4 w-4" />} onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  )
}

/** Search-flavoured empty state for listing pages. */
export function NoResultsState({
  query,
  onClear,
}: {
  query?: string
  onClear?: () => void
}) {
  return (
    <EmptyState
      icon={<SearchX className="h-5 w-5 text-ink-faint" aria-hidden />}
      title={query ? `No results for “${query}”` : 'Nothing here yet'}
      description={
        query
          ? 'Try a different spelling, widen your filters, or browse the full catalogue.'
          : 'We could not find anything matching these filters.'
      }
      action={
        onClear && (
          <Button variant="outline" onClick={onClear}>
            Clear filters
          </Button>
        )
      }
    />
  )
}

/* -------------------------------------------------------------------------- */
/* Status pill                                                                  */
/* -------------------------------------------------------------------------- */

export function StatusDot({ className }: { className?: string }) {
  return <span className={cn('h-1.5 w-1.5 rounded-full', className)} aria-hidden />
}
