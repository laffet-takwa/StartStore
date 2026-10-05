import { forwardRef } from 'react'
import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Loader2 } from 'lucide-react'

import { cn } from '@/lib/cn'

export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'outline'
  | 'ghost'
  | 'danger'
  | 'subtle'
export type ButtonSize = 'sm' | 'md' | 'lg' | 'icon'

const VARIANTS: Record<ButtonVariant, string> = {
  primary:
    'bg-brand-600 text-white shadow-sm hover:bg-brand-700 active:bg-brand-800 focus-visible:ring-brand-500 disabled:bg-brand-300',
  secondary:
    'bg-ink text-white shadow-sm hover:bg-ink-soft active:bg-ink focus-visible:ring-ink disabled:bg-zinc-400',
  outline:
    'border border-zinc-300 bg-white text-ink shadow-sm hover:border-zinc-400 hover:bg-zinc-50 active:bg-zinc-100 focus-visible:ring-zinc-400 disabled:text-zinc-400',
  ghost:
    'bg-transparent text-ink-soft hover:bg-zinc-100 hover:text-ink focus-visible:ring-zinc-300 disabled:text-zinc-400',
  danger:
    'bg-rose-600 text-white shadow-sm hover:bg-rose-700 active:bg-rose-800 focus-visible:ring-rose-500 disabled:bg-rose-300',
  subtle:
    'bg-brand-50 text-brand-700 hover:bg-brand-100 active:bg-brand-200 focus-visible:ring-brand-400',
}

const SIZES: Record<ButtonSize, string> = {
  sm: 'h-9 px-3.5 text-sm gap-1.5 rounded-lg',
  md: 'h-11 px-5 text-sm gap-2 rounded-xl',
  lg: 'h-12 px-6 text-[0.9375rem] gap-2 rounded-xl',
  icon: 'h-10 w-10 rounded-lg',
}

const BASE =
  'inline-flex select-none items-center justify-center whitespace-nowrap font-medium transition-all duration-150 ease-spring ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ' +
  'disabled:pointer-events-none disabled:opacity-70 active:scale-[0.985]'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  /** Swaps the label for a spinner and blocks interaction. */
  isLoading?: boolean
  loadingText?: string
  leftIcon?: ReactNode
  rightIcon?: ReactNode
  fullWidth?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'primary',
    size = 'md',
    isLoading = false,
    loadingText,
    leftIcon,
    rightIcon,
    fullWidth,
    className,
    children,
    disabled,
    type = 'button',
    ...rest
  },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || isLoading}
      aria-busy={isLoading || undefined}
      className={cn(
        BASE,
        VARIANTS[variant],
        SIZES[size],
        fullWidth && 'w-full',
        className,
      )}
      {...rest}
    >
      {isLoading ? (
        <>
          <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden />
          <span>{loadingText ?? children}</span>
        </>
      ) : (
        <>
          {leftIcon}
          {children}
          {rightIcon}
        </>
      )}
    </button>
  )
})

export interface ButtonLinkProps {
  to: string
  variant?: ButtonVariant
  size?: ButtonSize
  className?: string
  children: ReactNode
  leftIcon?: ReactNode
  rightIcon?: ReactNode
  fullWidth?: boolean
}

/** A link that looks like a button - used for navigation, not actions. */
export function ButtonLink({
  to,
  variant = 'primary',
  size = 'md',
  className,
  children,
  leftIcon,
  rightIcon,
  fullWidth,
}: ButtonLinkProps) {
  return (
    <Link
      to={to}
      className={cn(BASE, VARIANTS[variant], SIZES[size], fullWidth && 'w-full', className)}
    >
      {leftIcon}
      {children}
      {rightIcon}
    </Link>
  )
}

/** Icon-only control that still needs an accessible name. */
export const IconButton = forwardRef<
  HTMLButtonElement,
  ButtonProps & { label: string }
>(function IconButton({ label, size = 'icon', className, children, ...rest }, ref) {
  return (
    <Button ref={ref} size={size} variant="ghost" aria-label={label} className={className} {...rest}>
      {children}
    </Button>
  )
})
