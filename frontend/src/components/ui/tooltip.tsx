import { type ReactNode, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/utils/cn'

type TooltipProps = {
  content: string
  children: ReactNode
  side?: 'top' | 'bottom' | 'left' | 'right'
  delay?: number
  className?: string
}

export function Tooltip({ content, children, side = 'right', delay = 300, className }: TooltipProps) {
  const [open, setOpen] = useState(false)
  let timeout: ReturnType<typeof setTimeout>

  const show = () => {
    timeout = setTimeout(() => setOpen(true), delay)
  }
  const hide = () => {
    clearTimeout(timeout)
    setOpen(false)
  }

  const sideClasses: Record<string, string> = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  }

  const arrowClasses: Record<string, string> = {
    top: 'top-full left-1/2 -translate-x-1/2 border-t-slate-800 border-x-transparent border-b-transparent',
    bottom: 'bottom-full left-1/2 -translate-x-1/2 border-b-slate-800 border-x-transparent border-t-transparent',
    left: 'left-full top-1/2 -translate-y-1/2 border-l-slate-800 border-y-transparent border-r-transparent',
    right: 'right-full top-1/2 -translate-y-1/2 border-r-slate-800 border-y-transparent border-l-transparent',
  }

  return (
    <div className={cn('relative inline-flex', className)} onMouseEnter={show} onMouseLeave={hide} onFocus={show} onBlur={hide}>
      {children}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.1 }}
            className={cn('fixed z-[60] px-2.5 py-1.5 rounded-lg bg-slate-800 text-white text-xs font-medium whitespace-nowrap shadow-lg pointer-events-none', sideClasses[side])}
            role="tooltip"
          >
            {content}
            <div className={cn('absolute w-0 h-0 border-4', arrowClasses[side])} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export function TooltipContent({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('px-2.5 py-1.5 rounded-lg bg-slate-800 text-white text-xs font-medium whitespace-nowrap shadow-lg', className)}>{children}</div>
}

export function TooltipTrigger({ children }: { children: ReactNode }) {
  return <>{children}</>
}
