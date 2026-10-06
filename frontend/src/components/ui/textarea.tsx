import { type TextareaHTMLAttributes, forwardRef } from 'react'
import { cn } from '@/utils/cn'

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  hint?: string
  size?: 'sm' | 'md' | 'lg'
  fullWidth?: boolean
  showCount?: boolean
  maxLength?: number
}

const sizeClasses = {
  sm: 'text-sm px-2.5 py-2',
  md: 'text-sm px-3 py-2.5',
  lg: 'text-base px-4 py-3',
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, hint, size = 'md', fullWidth = true, showCount, maxLength, className, id, ...props }, ref) => {
    const textareaId = id || label?.toLowerCase().replace(/\s+/g, '-')
    const currentLength = typeof props.value === 'string' ? props.value.length : 0

    return (
      <div className={cn(fullWidth ? 'w-full' : '', 'space-y-1.5')}>
        {label && <label htmlFor={textareaId} className="label">{label}</label>}
        <textarea
          ref={ref}
          id={textareaId}
          maxLength={maxLength}
          className={cn(
            'w-full rounded-lg border bg-surface text-slate-900 placeholder:text-muted transition-colors resize-none',
            'focus:ring-2 focus:ring-primary/20 focus:border-primary focus:outline-none',
            'disabled:opacity-60 disabled:cursor-not-allowed',
            sizeClasses[size] || sizeClasses.md,
            error ? 'border-danger focus:ring-danger/20 focus:border-danger' : 'border-slate-200 dark:border-slate-600',
            className
          )}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? `${textareaId}-error` : hint ? `${textareaId}-hint` : showCount && maxLength ? `${textareaId}-count` : undefined}
          {...props}
        />
        {(showCount || hint || error) && (
          <div className="flex items-center justify-between">
            <div>
              {error && (
                <p id={`${textareaId}-error`} className="text-sm text-danger" role="alert">
                  {error}
                </p>
              )}
              {hint && !error && (
                <p id={`${textareaId}-hint`} className="text-sm text-muted">
                  {hint}
                </p>
              )}
            </div>
            {showCount && maxLength && (
              <span id={`${textareaId}-count`} className="text-sm text-muted">
                {currentLength}/{maxLength}
              </span>
            )}
          </div>
        )}
      </div>
    )
  }
)

Textarea.displayName = 'Textarea'
