import { ChevronLeft, ChevronRight } from 'lucide-react'

import { cn } from '@/lib/cn'

/** Previous/next control used by the admin tables. */
export function TablePagination({
  page,
  totalPages,
  count,
  pageSize,
  onChange,
  className,
}: {
  page: number
  totalPages: number
  count: number
  pageSize: number
  onChange: (page: number) => void
  className?: string
}) {
  const from = count === 0 ? 0 : (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, count)

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-between gap-3 border-t border-zinc-100 px-5 py-3 sm:flex-row',
        className,
      )}
    >
      <p className="text-xs text-ink-muted">
        {from}–{to} of {count}
      </p>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onChange(page - 1)}
          disabled={page <= 1}
          aria-label="Previous page"
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-300 text-ink-soft transition-colors hover:bg-zinc-50 disabled:pointer-events-none disabled:text-zinc-300"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="px-2 text-xs font-medium text-ink-soft">
          {page} / {Math.max(totalPages, 1)}
        </span>
        <button
          type="button"
          onClick={() => onChange(page + 1)}
          disabled={page >= totalPages}
          aria-label="Next page"
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-300 text-ink-soft transition-colors hover:bg-zinc-50 disabled:pointer-events-none disabled:text-zinc-300"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

/** Page header for an admin section. */
export function AdminPageHeader({
  title,
  description,
  action,
  className,
}: {
  title: string
  description?: string
  action?: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn('flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between', className)}>
      <div className="min-w-0">
        <h1 className="text-xl font-semibold tracking-tight text-ink sm:text-2xl">{title}</h1>
        {description && (
          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-ink-muted">{description}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}

/** Horizontal scroll container so tables stay usable on mobile. */
export function TableWrapper({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('overflow-x-auto', className)}>
      <table className="w-full min-w-[640px] border-collapse text-left text-sm">
        {children}
      </table>
    </div>
  )
}

export function Th({
  children,
  className,
  align = 'left',
}: {
  children?: React.ReactNode
  className?: string
  align?: 'left' | 'right' | 'center'
}) {
  return (
    <th
      scope="col"
      className={cn(
        'border-b border-zinc-100 px-5 py-3 text-2xs font-semibold uppercase tracking-[0.08em] text-ink-muted',
        align === 'right' && 'text-right',
        align === 'center' && 'text-center',
        align === 'left' && 'text-left',
        className,
      )}
    >
      {children}
    </th>
  )
}

export function Td({
  children,
  className,
  align = 'left',
}: {
  children?: React.ReactNode
  className?: string
  align?: 'left' | 'right' | 'center'
}) {
  return (
    <td
      className={cn(
        'border-b border-zinc-100 px-5 py-4 align-middle text-ink-soft',
        align === 'right' && 'text-right',
        align === 'center' && 'text-center',
        className,
      )}
    >
      {children}
    </td>
  )
}

export function Tr({
  children,
  onClick,
  className,
}: {
  children: React.ReactNode
  onClick?: () => void
  className?: string
}) {
  return (
    <tr
      onClick={onClick}
      className={cn(
        'transition-colors',
        onClick && 'cursor-pointer hover:bg-surface',
        className,
      )}
    >
      {children}
    </tr>
  )
}
