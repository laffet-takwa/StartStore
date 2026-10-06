import { type ReactNode, useEffect, useRef } from 'react'
import { X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/utils/cn'

type ModalProps = {
  open: boolean
  onClose: () => void
  title?: string
  description?: string
  children: ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  footer?: ReactNode
  closeOnOverlay?: boolean
}

const sizeClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-2xl',
  full: 'max-w-7xl',
}

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  size = 'md',
  footer,
  closeOnOverlay = true,
}: ModalProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (open) {
      closeButtonRef.current?.focus()
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) onClose()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onClose])

  const prefersReducedMotion = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

  return (
    <AnimatePresence mode="wait">
      {open && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <motion.div
            initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0 }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.2 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={closeOnOverlay ? onClose : undefined}
          />
          <motion.div
            initial={prefersReducedMotion ? { opacity: 1, scale: 1, y: 0 } : { opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={prefersReducedMotion ? { opacity: 0, scale: 1, y: 0 } : { opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.2, ease: 'easeOut' }}
            className={cn(
              'relative w-full bg-surface rounded-xl shadow-2xl border border-slate-200 dark:border-dark-border dark:bg-dark-surface flex flex-col max-h-[90vh]',
              sizeClasses[size]
            )}
          >
            {(title || description) && (
              <div className="flex items-start justify-between gap-4 px-6 py-5 border-b border-base">
                <div className="min-w-0">
                  {title && <h2 className="text-lg font-semibold text-base">{title}</h2>}
                  {description && <p className="text-sm text-muted-base mt-0.5">{description}</p>}
                </div>
                <button
                  ref={closeButtonRef}
                  onClick={onClose}
                  className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-dark-surface-secondary transition-colors flex-shrink-0"
                  aria-label="Close modal"
                >
                  <X className="h-4 w-4 text-muted" />
                </button>
              </div>
            )}

            <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>

            {footer && (
              <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-base bg-surface-secondary/50 dark:bg-dark-surface-secondary/50 rounded-b-xl">
                {footer}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
