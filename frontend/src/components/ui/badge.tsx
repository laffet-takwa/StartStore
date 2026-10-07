import { cn } from '@/utils/cn'

export function Badge({
  children,
  variant = 'default',
  size = 'md',
  className = '',
}: {
  children: React.ReactNode
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'outline' | 'secondary' | 'primary'
  size?: 'xs' | 'sm' | 'md'
  className?: string
}) {
  const variants: Record<string, string> = {
    default: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200',
    secondary: 'bg-surface-secondary text-slate-700 dark:bg-dark-surface-secondary dark:text-dark-text-secondary',
    success: 'bg-success-light text-success dark:bg-dark-success-light dark:text-dark-success',
    warning: 'bg-warning-light text-warning dark:bg-dark-warning-light dark:text-dark-warning',
    danger: 'bg-danger-light text-danger dark:bg-dark-danger-light dark:text-dark-danger',
    info: 'bg-info-light text-info dark:bg-dark-info-light dark:text-dark-info',
    outline: 'border border-slate-300 text-slate-700 bg-transparent dark:border-slate-600 dark:text-dark-text-secondary',
    primary: 'bg-primary-light text-primary dark:bg-dark-primary-light dark:text-dark-primary',
  }

  const sizes: Record<string, string> = {
    xs: 'px-1.5 py-0.5 text-[10px]',
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-xs',
  }

  return (
    <span className={cn('inline-flex items-center font-medium rounded-full', variants[variant], sizes[size], className)}>
      {children}
    </span>
  )
}
