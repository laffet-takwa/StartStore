import { type ReactNode, useState, type ComponentType } from 'react'

type ErrorBoundaryProps = {
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: { componentStack: string }) => void
  children: ReactNode
}

export function ErrorBoundary({ fallback, onError, children }: ErrorBoundaryProps) {
  const [error, setError] = useState<Error | null>(null)

  if (error) {
    if (fallback) {
      return <>{fallback}</>
    }
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] p-6 text-center">
        <div className="h-12 w-12 rounded-full bg-danger/10 flex items-center justify-center mb-4">
          <span className="text-lg text-danger">!</span>
        </div>
        <p className="text-sm font-semibold text-slate-900">Something went wrong</p>
        <p className="text-xs text-muted mt-1 max-w-sm">{error.message}</p>
        <button
          onClick={() => setError(null)}
          className="mt-4 px-4 py-2 text-sm border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
        >
          Try Again
        </button>
      </div>
    )
  }

  return (
    <ErrorCatcher onError={(err) => { setError(err); onError?.(err, { componentStack: '' }) }}>
      {children}
    </ErrorCatcher>
  )
}

type ErrorCatcherProps = {
  onError: (error: Error, errorInfo: { componentStack: string }) => void
  children: ReactNode
}

function ErrorCatcher({ onError, children }: ErrorCatcherProps) {
  try {
    return <>{children}</>
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error))
    onError(err, { componentStack: '' })
    return null
  }
}

export function withErrorBoundary<P extends object>(Component: ComponentType<P>, boundaryProps?: Omit<ErrorBoundaryProps, 'children'>) {
  const Wrapped = (props: P) => (
    <ErrorBoundary {...boundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  )
  Wrapped.displayName = `withErrorBoundary(${Component.displayName || Component.name || 'Component'})`
  return Wrapped
}
