import { motion } from 'framer-motion'
import { cn } from '@/utils/cn'

export type ToggleProps = {
  label?: string
  description?: string
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
  size?: 'sm' | 'md' | 'lg'
}

const sizeClasses = {
  sm: { track: 'h-5 w-9', thumb: 'h-3.5 w-3.5', translate: 'translate-x-4' },
  md: { track: 'h-6 w-11', thumb: 'h-4 w-4', translate: 'translate-x-5' },
  lg: { track: 'h-7 w-14', thumb: 'h-5 w-5', translate: 'translate-x-7' },
}

export function Toggle({ label, description, checked, onChange, disabled = false, size = 'md' }: ToggleProps) {
  const sizes = sizeClasses[size]

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative inline-flex flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent',
        'transition-colors duration-200 ease-in-out',
        'focus:outline-none focus:ring-2 focus:ring-primary/20 focus:ring-offset-2',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        checked ? 'bg-primary' : 'bg-slate-200 dark:bg-slate-700',
        sizes.track
      )}
    >
      <motion.span
        layout
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        className={cn(
          'inline-block rounded-full bg-white shadow-sm',
          sizes.thumb,
          checked ? sizes.translate : 'translate-x-0.5',
          'pointer-events-none'
        )}
      />
      {label && (
        <div className="ml-3 text-left">
          <span className="text-sm font-medium text-base">{label}</span>
          {description && <p className="text-sm text-muted-base">{description}</p>}
        </div>
      )}
    </button>
  )
}
