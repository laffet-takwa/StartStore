import { type ReactNode, useEffect, useRef } from 'react'
import { X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/utils/cn'

type BottomSheetProps = {
  open: boolean
  onClose: () => void
  title?: string
  description?: string
  children: ReactNode
  footer?: ReactNode
}

const prefersReducedMotion = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

export function BottomSheet({ open, onClose, title, description, children, footer }: BottomSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (open) {
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

  return (
    <AnimatePresence mode="wait">
      {open && (
        <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center">
          <motion.div
            initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0 }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.2 }}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            ref={sheetRef}
            initial={prefersReducedMotion ? { y: 0 } : { y: '100%' }}
            animate={{ y: 0 }}
            exit={prefersReducedMotion ? { y: 0 } : { y: '100%' }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.3, ease: 'easeOut' }}
            className={cn(
              'relative w-full max-h-[85vh] sm:max-h-[90vh] bg-surface rounded-t-2xl sm:rounded-2xl shadow-2xl border border-slate-200 dark:border-dark-border dark:bg-dark-surface flex flex-col',
              'mx-auto sm:mx-4 sm:w-full sm:max-w-lg'
            )}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-base">
              <div className="min-w-0">
                {title && <h2 className="text-base font-semibold text-base">{title}</h2>}
                {description && <p className="text-sm text-muted-base mt-0.5">{description}</p>}
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-dark-surface-secondary transition-colors flex-shrink-0"
                aria-label="Close sheet"
              >
                <X className="h-4 w-4 text-muted" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>

            {footer && (
              <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-base bg-surface-secondary/50 dark:bg-dark-surface-secondary/50">
                {footer}
              </div>
            )}

            <div className="sm:hidden flex justify-center pt-2 pb-1">
              <div className="h-1.5 w-10 rounded-full bg-slate-300 dark:bg-slate-600" />
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
