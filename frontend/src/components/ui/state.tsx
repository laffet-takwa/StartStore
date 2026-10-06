import { Button } from '@/components/ui/button'

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string
  description?: string
  action?: { label: string; onClick: () => void }
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center mb-4">
        <span className="text-xl text-muted">−</span>
      </div>
      <p className="text-sm font-semibold text-slate-900">{title}</p>
      {description && <p className="text-xs text-muted mt-1 max-w-sm">{description}</p>}
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
      <div className="h-12 w-12 rounded-full bg-danger/10 flex items-center justify-center mb-4">
        <span className="text-lg text-danger">!</span>
      </div>
      <p className="text-sm font-semibold text-slate-900">{title}</p>
      {description && <p className="text-xs text-muted mt-1 max-w-sm">{description}</p>}
      {onRetry && (
        <Button size="sm" variant="outline" className="mt-4" onClick={onRetry}>
          Try Again
        </Button>
      )}
    </div>
  )
}
