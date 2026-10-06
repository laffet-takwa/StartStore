import { type ReactNode } from 'react'
import { Check, Clock, AlertCircle, X } from 'lucide-react'
import { motion } from 'framer-motion'
import { cn } from '@/utils/cn'

export type Step = {
  key: string
  label: string
  description?: string
  status: 'completed' | 'current' | 'pending' | 'cancelled'
  timestamp?: string
}

const statusConfig: Record<string, { icon: ReactNode; color: string }> = {
  completed: { icon: <Check className="h-4 w-4" />, color: 'text-success bg-success-light dark:bg-dark-success-light dark:text-dark-success' },
  current: { icon: <Clock className="h-4 w-4" />, color: 'text-primary bg-primary-light dark:bg-dark-primary-light dark:text-dark-primary' },
  pending: { icon: <AlertCircle className="h-4 w-4" />, color: 'text-muted-base bg-slate-100 dark:bg-slate-800 dark:text-dark-muted' },
  cancelled: { icon: <X className="h-4 w-4" />, color: 'text-danger bg-danger-light dark:bg-dark-danger-light dark:text-dark-danger' },
}

export function StatusTimeline({ steps }: { steps: Step[] }) {
  return (
    <div className="relative">
      <div className="absolute left-6 top-0 bottom-0 w-px border-base" />
      <div className="space-y-6">
        {steps.map((step, idx) => {
          const config = statusConfig[step.status] || statusConfig.pending

          return (
            <motion.div
              key={step.key}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="relative flex gap-4"
            >
              <div className={cn('relative z-10 h-12 w-12 rounded-full flex items-center justify-center flex-shrink-0', config.color)}>
                {config.icon}
              </div>

              <div className="flex-1 min-w-0 pb-6">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className={cn('text-sm font-medium', step.status === 'cancelled' ? 'text-danger' : 'text-base')}>
                      {step.label}
                    </p>
                    {step.description && (
                      <p className="text-sm text-muted-base mt-0.5">{step.description}</p>
                    )}
                  </div>
                  {step.timestamp && (
                    <span className="text-sm text-muted-base whitespace-nowrap">{step.timestamp}</span>
                  )}
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
