import { type ReactNode, useState, useEffect } from 'react'
import { cn } from '@/utils/cn'
import { Button } from '@/components/ui'
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'

export type Column<T> = {
  key: string
  header: string
  width?: string
  align?: 'left' | 'right' | 'center'
  render?: (row: T, index: number) => ReactNode
  mobileLabel?: string
}

export type DataTableProps<T> = {
  columns: Column<T>[]
  data: T[]
  keyExtractor: (row: T, index: number) => string | number
  emptyState?: ReactNode
  loading?: boolean
  skeletonRows?: number
  pageSize?: number
  className?: string
  onRowClick?: (row: T) => void
  mobileCard?: (row: T, idx: number) => ReactNode
}

export function DataTable<T>({
  columns,
  data,
  keyExtractor,
  emptyState,
  loading = false,
  skeletonRows = 5,
  pageSize = 10,
  className = '',
  onRowClick,
  mobileCard,
}: DataTableProps<T>) {
  const [page, setPage] = useState(0)
  const totalPages = Math.max(1, Math.ceil(data.length / pageSize))
  const paginated = data.slice(page * pageSize, (page + 1) * pageSize)

  useEffect(() => {
    setPage(0)
  }, [data.length])

  if (loading) {
    return (
      <div className={cn('rounded-xl border border-slate-200 dark:border-dark-border overflow-hidden', className)}>
        <div className="hidden md:block">
          <div className="border-b border-slate-200 dark:border-dark-border bg-slate-50 dark:bg-dark-surface-secondary">
              <div className="flex gap-4 px-4 py-3">
                {columns.map((_col, i) => (
                  <div key={i} className="h-3.5 w-20 rounded bg-slate-200 dark:bg-slate-700 animate-pulse" />
                ))}
              </div>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-700/50">
            {Array.from({ length: skeletonRows }).map((_, idx) => (
              <div key={idx} className="flex gap-4 px-4 py-3.5">
                {columns.map((_, i) => (
                  <div key={i} className="h-3.5 w-24 rounded bg-slate-200 dark:bg-slate-700 animate-pulse" />
                ))}
              </div>
            ))}
          </div>
        </div>
        <div className="md:hidden p-4 space-y-3">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div key={idx} className="rounded-lg border border-slate-200 dark:border-dark-border p-4 space-y-2">
              <div className="h-3.5 w-32 rounded bg-slate-200 dark:bg-slate-700 animate-pulse" />
              <div className="h-3 w-48 rounded bg-slate-200 dark:bg-slate-700 animate-pulse" />
              <div className="h-3 w-24 rounded bg-slate-200 dark:bg-slate-700 animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  const renderPagination = () => {
    if (totalPages <= 1) return null
    return (
      <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 dark:border-dark-border">
        <p className="text-xs text-muted">
          Showing {page * pageSize + 1}–{Math.min((page + 1) * pageSize, data.length)} of {data.length}
        </p>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setPage(0)}
            disabled={page === 0}
            aria-label="First page"
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            aria-label="Previous page"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-xs text-muted px-2">
            {page + 1} / {totalPages}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
            aria-label="Next page"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setPage(totalPages - 1)}
            disabled={page >= totalPages - 1}
            aria-label="Last page"
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    )
  }

  const alignClasses: Record<string, string> = {
    left: 'text-left',
    right: 'text-right',
    center: 'text-center',
  }

  return (
    <div className={cn('rounded-xl border border-slate-200 dark:border-dark-border overflow-hidden', className)}>
      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 dark:border-dark-border bg-slate-50 dark:bg-dark-surface-secondary">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={cn('px-4 py-3 font-medium text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider', alignClasses[col.align || 'left'])}
                  style={col.width ? { width: col.width } : undefined}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
            {paginated.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-12">
                  {emptyState || (
                    <div className="text-center text-sm text-muted">No data available</div>
                  )}
                </td>
              </tr>
            ) : (
              paginated.map((row, idx) => (
                <tr
                  key={keyExtractor(row, idx)}
                  onClick={() => onRowClick?.(row)}
                  className={cn(
                    'transition-colors',
                    onRowClick ? 'cursor-pointer hover:bg-slate-50 dark:hover:bg-dark-surface-secondary' : 'hover:bg-slate-50 dark:hover:bg-dark-surface-secondary'
                  )}
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={cn('px-4 py-3 text-sm', alignClasses[col.align || 'left'])}
                    >
                      {col.render ? col.render(row, idx) : (row as any)[col.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-700/50">
        {paginated.length === 0 ? (
          <div className="py-10 text-center text-sm text-muted">
            {emptyState || 'No data available'}
          </div>
        ) : (
          paginated.map((row, idx) => {
            if (mobileCard) {
              return (
                <div
                  key={keyExtractor(row, idx)}
                  onClick={() => onRowClick?.(row)}
                  className={cn(onRowClick && 'cursor-pointer')}
                >
                  {mobileCard(row, idx)}
                </div>
              )
            }
            return (
              <div
                key={keyExtractor(row, idx)}
                onClick={() => onRowClick?.(row)}
                className={cn('p-4 space-y-2.5', onRowClick && 'cursor-pointer active:bg-slate-50 dark:active:bg-dark-surface-secondary')}
              >
                {columns.map((col) => (
                  <div key={col.key} className="flex items-center justify-between gap-3">
                    <span className="text-xs text-muted flex-shrink-0">{col.mobileLabel || col.header}</span>
                    <span className="text-sm text-slate-900 dark:text-slate-100 text-right truncate">
                      {col.render ? col.render(row, idx) : (row as any)[col.key]}
                    </span>
                  </div>
                ))}
              </div>
            )
          })
        )}
      </div>

      {renderPagination()}
    </div>
  )
}
