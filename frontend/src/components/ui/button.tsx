import { type ReactNode, type ButtonHTMLAttributes, type AnchorHTMLAttributes, forwardRef } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/utils/cn'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-primary/20 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.98]',
  {
    variants: {
      variant: {
        primary: 'bg-primary text-white hover:bg-primary-hover shadow-sm hover:shadow-md',
        secondary: 'bg-slate-900 text-white hover:bg-slate-800',
        outline: 'border border-slate-300 text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-dark-text-secondary dark:hover:bg-dark-surface-secondary',
        ghost: 'text-slate-700 hover:bg-slate-100 dark:text-dark-text-secondary dark:hover:bg-dark-surface-secondary',
        danger: 'bg-danger text-white hover:bg-danger/90',
        success: 'bg-success text-white hover:bg-success/90',
      },
      size: {
        sm: 'h-9 px-3 text-sm',
        md: 'h-10 px-4 text-sm',
        lg: 'h-11 px-5 text-base',
        xl: 'h-12 px-6 text-base',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
)

type ButtonProps = {
  variant?: VariantProps<typeof buttonVariants>['variant']
  size?: VariantProps<typeof buttonVariants>['size']
  loading?: boolean
  icon?: ReactNode
  as?: 'button' | 'a'
  href?: string
} & ButtonHTMLAttributes<HTMLButtonElement> &
  AnchorHTMLAttributes<HTMLAnchorElement>

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant, size, loading = false, icon, children, className, disabled, as = 'button', href, ...props }, ref) => {
    const classes = cn(buttonVariants({ variant, size }), className)

    if (as === 'a' && href) {
      return (
        <a
          ref={ref as any}
          href={href}
          className={classes}
          {...props}
          aria-disabled={disabled || loading}
          tabIndex={disabled || loading ? -1 : undefined}
        >
          {loading ? <span className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" /> : icon}
          {children}
        </a>
      )
    }

    return (
      <button
        ref={ref}
        className={classes}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? <span className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" /> : icon}
        {children}
      </button>
    )
  }
)

Button.displayName = 'Button'
