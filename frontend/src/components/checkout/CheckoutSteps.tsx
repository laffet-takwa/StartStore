import { Check } from 'lucide-react'

import { cn } from '@/lib/cn'
import type { OrderStatus } from '@/types'
import { ORDER_STATUS_META } from '@/utils/constants'

export interface CheckoutStepsProps {
  /** 1-based index of the step in progress. */
  current: number
  steps?: { id: string; label: string }[]
  className?: string
}

const DEFAULT_STEPS = [
  { id: 'info', label: 'Information' },
  { id: 'address', label: 'Address' },
  { id: 'review', label: 'Review' },
  { id: 'payment', label: 'Payment' },
]

/**
 * Checkout progress rail.
 *
 * Steps already completed stay tappable so a customer can go back without
 * losing what they entered; later steps are inert until reached.
 */
export function CheckoutSteps({ current, steps = DEFAULT_STEPS, className }: CheckoutStepsProps) {
  return (
    <ol className={cn('flex items-center gap-1.5 sm:gap-2', className)}>
      {steps.map((step, index) => {
        const position = index + 1
        const isDone = position < current
        const isCurrent = position === current

        return (
          <li key={step.id} className="flex min-w-0 flex-1 items-center gap-1.5 sm:gap-2">
            <div className="flex min-w-0 items-center gap-2">
              <span
                className={cn(
                  'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-2xs font-semibold transition-colors duration-200',
                  isDone && 'bg-brand-600 text-white',
                  isCurrent && 'bg-ink text-white',
                  !isDone && !isCurrent && 'bg-zinc-100 text-ink-faint',
                )}
                aria-current={isCurrent ? 'step' : undefined}
              >
                {isDone ? <Check className="h-3.5 w-3.5" strokeWidth={3} aria-hidden /> : position}
              </span>
              <span
                className={cn(
                  'hidden truncate text-xs font-medium sm:inline',
                  isCurrent ? 'text-ink' : isDone ? 'text-ink-soft' : 'text-ink-faint',
                )}
              >
                {step.label}
              </span>
            </div>
            {position < steps.length && (
              <span
                className={cn(
                  'h-px flex-1 transition-colors duration-200',
                  position < current ? 'bg-brand-300' : 'bg-zinc-200',
                )}
                aria-hidden
              />
            )}
          </li>
        )
      })}
    </ol>
  )
}

/** Slim progress bar used on narrow screens where the labels do not fit. */
export function CheckoutProgressBar({
  current,
  total = DEFAULT_STEPS.length,
}: {
  current: number
  total?: number
}) {
  return (
    <div>
      <div className="h-1.5 overflow-hidden rounded-full bg-zinc-200">
        <div
          className="h-full rounded-full bg-brand-600 transition-all duration-500 ease-spring"
          style={{ width: `${Math.min(100, (current / total) * 100)}%` }}
        />
      </div>
      <p className="mt-2 text-2xs font-medium text-ink-muted">
        Step {current} of {total}
      </p>
    </div>
  )
}

/** Horizontal lifecycle rail shown on an order detail page. */
export function OrderTimeline({ status }: { status: OrderStatus }) {
  const flow: OrderStatus[] = ['pending', 'confirmed', 'processing', 'shipped', 'delivered']
  const isCancelled = status === 'cancelled'
  const currentIndex = flow.indexOf(status)

  if (isCancelled) {
    return (
      <div className="flex items-center gap-2 rounded-xl bg-zinc-50 px-4 py-3">
        <span className={cn('h-2 w-2 rounded-full', ORDER_STATUS_META.cancelled.dot)} />
        <p className="text-sm font-medium text-ink-soft">This order was cancelled.</p>
      </div>
    )
  }

  return (
    <ol className="flex items-center">
      {flow.map((step, index) => {
        const reached = index <= currentIndex
        return (
          <li key={step} className="flex min-w-0 flex-1 items-center last:flex-none">
            <div className="flex flex-col items-center gap-1.5">
              <span
                className={cn(
                  'h-2.5 w-2.5 rounded-full ring-4 transition-all duration-300',
                  reached ? 'bg-brand-600 ring-brand-100' : 'bg-zinc-200 ring-zinc-50',
                )}
                aria-hidden
              />
              <span
                className={cn(
                  'hidden text-2xs font-medium sm:block',
                  reached ? 'text-ink' : 'text-ink-faint',
                )}
              >
                {ORDER_STATUS_META[step].label}
              </span>
            </div>
            {index < flow.length - 1 && (
              <span
                className={cn(
                  'mx-2 h-0.5 flex-1 rounded-full transition-colors duration-300',
                  index < currentIndex ? 'bg-brand-300' : 'bg-zinc-200',
                )}
                aria-hidden
              />
            )}
          </li>
        )
      })}
    </ol>
  )
}
