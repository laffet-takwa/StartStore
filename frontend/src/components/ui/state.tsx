import { Button } from '@/components/ui/button'
import { cn } from '@/utils/cn'

export function EmptyState({
  title,
  description,
  action,
  icon,
}: {
  title: string
  description?: string
  action?: { label: string; onClick: () => void }
  icon?: React.ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className={cn('h-12 w-12 rounded-full flex items-center justify-center mb-4', 'bg-slate-100 dark:bg-slate-800')}>
        {icon || <span className="text-xl text-muted">−</span>}
      </div>
      <p className="text-sm font-semibold text-base">{title}</p>
      {description && <p className="text-sm text-muted-base mt-1 max-w-sm">{description}</p>}
      {action && (
        <Button size="sm" className="mt-4" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  )
}

export function ErrorState({
  title = 'Something went wrong',
  description,
  onRetry,
}: {
  title?: string
  description?: string
  onRetry?: () => void
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="h-12 w-12 rounded-full bg-danger/10 dark:bg-dark-danger-light flex items-center justify-center mb-4">
        <span className="text-lg text-danger">!</span>
      </div>
      <p className="text-sm font-semibold text-base">{title}</p>
      {description && <p className="text-sm text-muted-base mt-1 max-w-sm">{description}</p>}
      {onRetry && (
        <Button size="sm" variant="outline" className="mt-4" onClick={onRetry}>
          Try Again
        </Button>
      )}
    </div>
  )
}

export function LoadingState({
  title = 'Loading...',
  description,
}: {
  title?: string
  description?: string
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin mb-4" />
      <p className="text-sm font-semibold text-base">{title}</p>
      {description && <p className="text-sm text-muted-base mt-1 max-w-sm">{description}</p>}
    </div>
  )
}
