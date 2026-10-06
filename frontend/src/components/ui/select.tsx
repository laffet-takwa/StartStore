import { type SelectHTMLAttributes, forwardRef } from 'react'
import { cn } from '@/utils/cn'

export interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  label?: string
  error?: string
  hint?: string
  placeholder?: string
  size?: 'sm' | 'md' | 'lg'
  fullWidth?: boolean
  options: Array<{ value: string | number; label: string; disabled?: boolean }>
}

const sizeClasses: Record<string, string> = {
  sm: 'h-8 px-2.5 text-sm',
  md: 'h-10 px-3 text-sm',
  lg: 'h-11 px-4 text-base',
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, hint, placeholder, size = 'md', fullWidth = true, options, className, id, ...props }, ref) => {
    const selectId = id || label?.toLowerCase().replace(/\s+/g, '-')

    return (
      <div className={cn(fullWidth ? 'w-full' : '', 'space-y-1.5')}>
        {label && <label htmlFor={selectId} className="label">{label}</label>}
        <div className="relative">
          <select
            ref={ref}
            id={selectId}
            className={cn(
              'w-full rounded-lg border bg-surface text-slate-900 appearance-none transition-colors',
              'focus:ring-2 focus:ring-primary/20 focus:border-primary focus:outline-none',
              'disabled:opacity-60 disabled:cursor-not-allowed',
              sizeClasses[size] || sizeClasses.md,
              error ? 'border-danger focus:ring-danger/20 focus:border-danger' : 'border-slate-200 dark:border-slate-600',
              'pr-10',
              className
            )}
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={error ? `${selectId}-error` : hint ? `${selectId}-hint` : undefined}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((opt) => (
              <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                {opt.label}
              </option>
            ))}
          </select>
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
        {error && (
          <p id={`${selectId}-error`} className="text-sm text-danger" role="alert">
            {error}
          </p>
        )}
        {hint && !error && (
          <p id={`${selectId}-hint`} className="text-sm text-muted">
            {hint}
          </p>
        )}
      </div>
    )
  }
)

Select.displayName = 'Select'
