import { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { cn } from '@/utils/cn'

export function Drawer({
  open,
  onClose,
  title,
  children,
  size = 'sm',
}: {
  open: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg' | 'full'
}) {
  const panelRef = useRef<HTMLDivElement>(null)

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    full: 'max-w-4xl',
  }

  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onClose])

  const prefersReducedMotion = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50">
          <motion.div
            initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0 }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.2 }}
            className="absolute inset-0 bg-black/40"
            onClick={onClose}
          />
          <motion.div
            ref={panelRef}
            initial={prefersReducedMotion ? { x: 0 } : { x: '100%' }}
            animate={{ x: 0 }}
            exit={prefersReducedMotion ? { x: 0 } : { x: '100%' }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.3, ease: 'easeOut' }}
            className={cn(
              'absolute right-0 top-0 bottom-0 w-full bg-surface shadow-xl border-l border-base flex flex-col',
              sizeClasses[size]
            )}
          >
            {(title || true) && (
              <div className="flex items-center justify-between border-b border-base px-4 h-14">
                <p className="text-sm font-semibold text-base">{title}</p>
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-dark-surface-secondary transition-colors"
                  aria-label="Close drawer"
                >
                  <X className="h-4 w-4 text-muted" />
                </button>
              </div>
            )}
            <div className="flex-1 overflow-y-auto p-4">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
