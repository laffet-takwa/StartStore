import { type ReactNode } from 'react'
import { cn } from '@/utils/cn'

export function Card({
  children,
  className = '',
  hover = false,
}: {
  children: ReactNode
  className?: string
  hover?: boolean
}) {
  return (
    <div
      className={cn('surface-base rounded-xl', hover && 'card-hover transition-all duration-200', className)}
    >
      {children}
    </div>
  )
}

export function CardHeader({
  title,
  description,
  action,
}: {
  title: string
  description?: string
  action?: ReactNode
}) {
  return (
    <div className="px-5 py-4 border-b border-base flex items-center justify-between gap-4">
      <div className="min-w-0">
        <p className="text-sm font-semibold text-base">{title}</p>
        {description && <p className="text-sm text-muted-base mt-0.5">{description}</p>}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  )
}

export function CardBody({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={cn('p-5', className)}>{children}</div>
}

export function CardFooter({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('px-5 py-4 border-t border-base bg-surface-secondary/50 rounded-b-xl', className)}>
      {children}
    </div>
  )
}
