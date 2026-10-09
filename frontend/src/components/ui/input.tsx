import { type ReactNode, type InputHTMLAttributes, forwardRef } from 'react'
import { cn } from '@/utils/cn'

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string
  error?: string
  hint?: string
  leftIcon?: ReactNode
  rightIcon?: ReactNode
  size?: 'sm' | 'md' | 'lg'
  fullWidth?: boolean
}

const sizeClasses: Record<string, string> = {
  sm: 'h-8 px-2.5 text-sm',
  md: 'h-10 px-3 text-sm',
  lg: 'h-11 px-4 text-base',
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, leftIcon, rightIcon, size = 'md', fullWidth = true, className, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')

    return (
      <div className={cn(fullWidth ? 'w-full' : '', 'space-y-1.5')}>
        {label && (
          <label htmlFor={inputId} className="label">
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              'w-full rounded-lg border bg-surface text-text-primary placeholder:text-text-muted transition-colors',
              'focus:ring-2 focus:ring-primary/20 focus:border-primary focus:outline-none',
              'disabled:opacity-60 disabled:cursor-not-allowed',
              sizeClasses[size] || sizeClasses.md,
              leftIcon ? 'pl-10' : '',
              rightIcon ? 'pr-10' : '',
              error ? 'border-danger focus:ring-danger/20 focus:border-danger' : 'border-border dark:border-dark-border',
              className
            )}
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none">
              {rightIcon}
            </div>
          )}
        </div>
        {error && (
          <p id={`${inputId}-error`} className="text-sm text-danger" role="alert">
            {error}
          </p>
        )}
        {hint && !error && (
          <p id={`${inputId}-hint`} className="text-sm text-muted">
            {hint}
          </p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'
