import type { ReactNode } from 'react'
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Banknote,
  Package,
  ShoppingCart,
  Users,
} from 'lucide-react'

import { Card } from '@/components/common/Display'
import { cn } from '@/lib/cn'
import { formatMoney } from '@/utils/format'

export interface StatCardProps {
  label: string
  value: string
  icon: ReactNode
  /** Optional comparison against last month, shown as a trend chip. */
  delta?: { value: number; label?: string }
  tone?: 'brand' | 'emerald' | 'amber' | 'neutral' | 'rose'
  hint?: string
}

const TONES = {
  brand: 'bg-brand-50 text-brand-700',
  emerald: 'bg-emerald-50 text-emerald-700',
  amber: 'bg-amber-50 text-amber-700',
  neutral: 'bg-zinc-100 text-ink-soft',
  rose: 'bg-rose-50 text-rose-700',
} as const

/** KPI tile for the admin dashboard. */
export function StatCard({ label, value, icon, delta, tone = 'brand', hint }: StatCardProps) {
  const rising = (delta?.value ?? 0) >= 0

  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-[0.08em] text-ink-muted">{label}</p>
          <p className="mt-2 truncate text-2xl font-semibold tracking-tight text-ink">{value}</p>
          {delta && (
            <p
              className={cn(
                'mt-1.5 inline-flex items-center gap-1 text-2xs font-medium',
                rising ? 'text-emerald-600' : 'text-rose-600',
              )}
            >
              {rising ? (
                <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
              ) : (
                <ArrowDownRight className="h-3.5 w-3.5" aria-hidden />
              )}
              {rising ? '+' : ''}
              {delta.value.toFixed(1)}% {delta.label ?? 'vs last month'}
            </p>
          )}
          {hint && !delta && <p className="mt-1.5 text-2xs text-ink-faint">{hint}</p>}
        </div>
        <span className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl', TONES[tone])}>
          {icon}
        </span>
      </div>
    </Card>
  )
}

/** The four headline figures. */
export function RevenueStat({
  total,
  thisMonth,
  previousMonth,
}: {
  total: string
  thisMonth: string
  previousMonth: string
}) {
  const current = Number(thisMonth) || 0
  const previous = Number(previousMonth) || 0
  const delta = previous > 0 ? ((current - previous) / previous) * 100 : undefined

  return (
    <StatCard
      label="Total sales"
      value={formatMoney(total)}
      tone="emerald"
      icon={<Banknote className="h-5 w-5" aria-hidden />}
      {...(delta !== undefined ? { delta: { value: delta, label: 'this month' } } : {})}
      hint={delta === undefined ? `${formatMoney(thisMonth)} this month` : undefined}
    />
  )
}

export function OrdersStat({
  total,
  pending,
  icon = <ShoppingCart className="h-5 w-5" aria-hidden />,
}: {
  total: number
  pending: number
  icon?: ReactNode
}) {
  return (
    <StatCard
      label="Orders"
      value={total.toLocaleString('en-US')}
      icon={icon}
      tone="brand"
      hint={pending > 0 ? `${pending} awaiting fulfilment` : 'All caught up'}
    />
  )
}

export function ProductsStat({
  total,
  lowStock,
}: {
  total: number
  lowStock: number
}) {
  return (
    <StatCard
      label="Products"
      value={total.toLocaleString('en-US')}
      icon={<Package className="h-5 w-5" aria-hidden />}
      tone="neutral"
      hint={lowStock > 0 ? `${lowStock} running low` : 'Stock levels healthy'}
    />
  )
}

export function CustomersStat({
  total,
  newThisMonth,
}: {
  total: number
  newThisMonth: number
}) {
  return (
    <StatCard
      label="Customers"
      value={total.toLocaleString('en-US')}
      icon={<Users className="h-5 w-5" aria-hidden />}
      tone="brand"
      hint={newThisMonth > 0 ? `${newThisMonth} joined this month` : undefined}
    />
  )
}

/* -------------------------------------------------------------------------- */
/* Charts (dependency-free)                                                     */
/* -------------------------------------------------------------------------- */

export interface BarDatum {
  label: string
  value: number
}

/**
 * Horizontal bar comparison.
 *
 * Deliberately dependency-free: the dashboard only ever compares a handful of
 * numbers, and a charting library would dwarf the rest of the bundle.
 */
export function BarComparison({
  data,
  formatValue = (value: number) => value.toLocaleString('en-US'),
  className,
  emptyLabel = 'No data yet',
}: {
  data: BarDatum[]
  formatValue?: (value: number) => string
  className?: string
  emptyLabel?: string
}) {
  const max = Math.max(...data.map((entry) => entry.value), 0)

  if (!data.length || max === 0) {
    return <p className={cn('py-6 text-center text-sm text-ink-muted', className)}>{emptyLabel}</p>
  }

  return (
    <ul className={cn('space-y-3.5', className)}>
      {data.map((entry) => (
        <li key={entry.label}>
          <div className="mb-1.5 flex items-baseline justify-between gap-3 text-xs">
            <span className="truncate font-medium text-ink-soft">{entry.label}</span>
            <span className="shrink-0 font-semibold tabular-nums text-ink">
              {formatValue(entry.value)}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-zinc-100">
            <div
              className="h-full rounded-full bg-brand-600 transition-all duration-700 ease-spring"
              style={{ width: `${Math.max(2, (entry.value / max) * 100)}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  )
}

/** Compact status breakdown with a proportional bar. */
export function StatusBreakdown({
  segments,
  total,
  className,
}: {
  segments: { label: string; value: number; colour: string }[]
  total: number
  className?: string
}) {
  const sum = total || segments.reduce((acc, entry) => acc + entry.value, 0)

  return (
    <div className={className}>
      <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-zinc-100">
        {segments.map((segment) => (
          <div
            key={segment.label}
            className={cn('h-full transition-all duration-500', segment.colour)}
            style={{ width: sum ? `${(segment.value / sum) * 100}%` : '0%' }}
            title={`${segment.label}: ${segment.value}`}
          />
        ))}
      </div>
      <ul className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-3">
        {segments.map((segment) => (
          <li key={segment.label} className="flex items-center gap-2 text-xs">
            <span className={cn('h-2 w-2 shrink-0 rounded-full', segment.colour)} aria-hidden />
            <span className="truncate text-ink-muted">{segment.label}</span>
            <span className="ml-auto font-semibold tabular-nums text-ink">{segment.value}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export { AlertTriangle }
