import { type ReactNode } from 'react'
import { cn } from '@/utils/cn'

export type Column<T> = {
  key: string
  header: string
  width?: string
  align?: 'left' | 'right' | 'center'
  render?: (row: T, index: number) => ReactNode
}

export type TableProps<T> = {
  columns: Column<T>[]
  data: T[]
  keyExtractor: (row: T, index: number) => string | number
  emptyState?: ReactNode
  className?: string
  striped?: boolean
}

export function Table<T>({
  columns,
  data,
  keyExtractor,
  emptyState,
  className = '',
  striped = false,
}: TableProps<T>) {
  const alignClasses: Record<string, string> = {
    left: 'text-left',
    right: 'text-right',
    center: 'text-center',
  }

  return (
    <div className={cn('overflow-x-auto', className)}>
      <table className="w-full text-sm">
        <thead>
          <tr className={cn('border-b border-base bg-surface-secondary/50 dark:bg-dark-surface-secondary/50')}>
            {columns.map((col) => (
              <th
                key={col.key}
                className={cn('px-4 py-3 font-medium text-muted-base', alignClasses[col.align || 'left'])}
                style={col.width ? { width: col.width } : undefined}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className={cn('divide-y divide-base')}>
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-12">
                {emptyState || (
                  <div className="text-center text-sm text-muted-base">No data available</div>
                )}
              </td>
            </tr>
          ) : (
            data.map((row, idx) => (
              <tr
                key={keyExtractor(row, idx)}
                className={cn('transition-colors hover:bg-surface-secondary/50 dark:hover:bg-dark-surface-secondary/50', striped && idx % 2 === 1 && 'bg-surface-secondary/50 dark:bg-dark-surface-secondary/50')}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={cn('px-4 py-3', alignClasses[col.align || 'left'])}
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
  )
}
