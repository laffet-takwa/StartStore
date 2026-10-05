import { useMemo } from 'react'

import { cn } from '@/lib/cn'
import { Button } from './Button'

export interface PaginationProps {
  page: number
  totalPages: number
  onChange: (page: number) => void
  className?: string
  /** Total rows, shown as "Showing 1–12 of 48". */
  summary?: { from: number; to: number; total: number }
}

/**
 * Numbered pagination with a condensed window.
 *
 * Always renders first/last plus a sliding run around the current page, so the
 * control stays a fixed width instead of reflowing as the user pages through.
 */
export function Pagination({ page, totalPages, onChange, className, summary }: PaginationProps) {
  const pages = useMemo(() => buildWindow(page, totalPages), [page, totalPages])

  if (totalPages <= 1) {
    return summary ? (
      <p className={cn('text-sm text-ink-muted', className)}>
        Showing {summary.from}–{summary.to} of {summary.total}
      </p>
    ) : null
  }

  const go = (next: number) => {
    if (next < 1 || next > totalPages || next === page) return
    onChange(next)
  }

  return (
    <nav
      className={cn('flex flex-col items-center gap-4 sm:flex-row sm:justify-between', className)}
      aria-label="Pagination"
    >
      {summary && (
        <p className="order-2 text-sm text-ink-muted sm:order-1">
          Showing {summary.from}–{summary.to} of {summary.total}
        </p>
      )}

      <div className="order-1 flex items-center gap-1 sm:order-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => go(page - 1)}
          disabled={page <= 1}
          aria-label="Previous page"
        >
          Previous
        </Button>

        <ul className="hidden items-center gap-1 sm:flex">
          {pages.map((entry, index) =>
            entry === 'gap' ? (
              <li key={`gap-${index}`} className="px-1.5 text-sm text-ink-faint">
                …
              </li>
            ) : (
              <li key={entry}>
                <button
                  type="button"
                  onClick={() => go(entry)}
                  aria-current={entry === page ? 'page' : undefined}
                  className={cn(
                    'h-9 min-w-9 rounded-lg px-2.5 text-sm font-medium transition-colors',
                    entry === page
                      ? 'bg-ink text-white'
                      : 'text-ink-soft hover:bg-zinc-100 hover:text-ink',
                  )}
                >
                  {entry}
                </button>
              </li>
            ),
          )}
        </ul>

        <span className="px-2 text-sm text-ink-muted sm:hidden">
          {page} / {totalPages}
        </span>

        <Button
          variant="outline"
          size="sm"
          onClick={() => go(page + 1)}
          disabled={page >= totalPages}
          aria-label="Next page"
        >
          Next
        </Button>
      </div>
    </nav>
  )
}

type PageEntry = number | 'gap'

function buildWindow(page: number, totalPages: number): PageEntry[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1)
  }
  const pages = new Set<number>([1, totalPages, page])
  if (page - 1 > 1) pages.add(page - 1)
  if (page + 1 < totalPages) pages.add(page + 1)
  if (page <= 3) [2, 3, 4].forEach((value) => pages.add(value))
  if (page >= totalPages - 2) {
    [totalPages - 3, totalPages - 2, totalPages - 1].forEach((value) => pages.add(value))
  }

  const sorted = [...pages].filter((value) => value >= 1 && value <= totalPages).sort((a, b) => a - b)

  const entries: PageEntry[] = []
  let previous = 0
  for (const value of sorted) {
    if (previous && value - previous > 1) entries.push('gap')
    entries.push(value)
    previous = value
  }
  return entries
}
