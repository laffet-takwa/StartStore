import { type ReactNode } from 'react'

export function Card({
  children,
  className = '',
  hover,
}: {
  children: ReactNode
  className?: string
  hover?: boolean
}) {
  return (
    <div
      className={`bg-surface border border-slate-200 rounded-xl ${hover ? 'card-hover' : ''} ${className}`}
    >
      {children}
    </div>
  )
}

export function CardHeader({ title, description }: { title: string; description?: string }) {
  return (
    <div className="px-5 py-4 border-b border-slate-100">
      <p className="text-sm font-semibold text-slate-900">{title}</p>
      {description && <p className="text-xs text-muted mt-1">{description}</p>}
    </div>
  )
}

export function CardBody({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`p-5 ${className}`}>{children}</div>
}
