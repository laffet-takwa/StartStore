import { type ReactNode } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/utils/cn'
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react'
import { Area, AreaChart, ResponsiveContainer } from 'recharts'

const kpiCardVariants = cva('relative overflow-hidden rounded-xl border p-5 transition-all duration-200', {
  variants: {
    variant: {
      default: 'bg-surface border-slate-200 dark:bg-dark-surface dark:border-dark-border',
      primary: 'bg-primary-light border-primary/20 dark:bg-dark-primary-light dark:border-dark-primary/30',
      success: 'bg-success-light border-success/20 dark:bg-dark-success-light dark:border-dark-success/30',
      warning: 'bg-warning-light border-warning/20 dark:bg-dark-warning-light dark:border-dark-warning/30',
      danger: 'bg-danger-light border-danger/20 dark:bg-dark-danger-light dark:border-dark-danger/30',
      info: 'bg-info-light border-info/20 dark:bg-dark-info-light dark:border-dark-info/30',
      purple: 'bg-purple-light border-purple/20 dark:bg-dark-purple-light dark:border-dark-purple/30',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
})

const iconContainerVariants: Record<string, string> = {
  default: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200',
  primary: 'bg-primary/15 text-primary dark:bg-dark-primary/25 dark:text-dark-primary',
  success: 'bg-success/15 text-success dark:bg-dark-success/25 dark:text-dark-success',
  warning: 'bg-warning/15 text-warning dark:bg-dark-warning/25 dark:text-dark-warning',
  danger: 'bg-danger/15 text-danger dark:bg-dark-danger/25 dark:text-dark-danger',
  info: 'bg-info/15 text-info dark:bg-dark-info/25 dark:text-dark-info',
  purple: 'bg-purple/15 text-purple dark:bg-dark-purple/25 dark:text-dark-purple',
}

const trendColors: Record<string, string> = {
  up: 'text-success',
  down: 'text-danger',
  neutral: 'text-muted',
}

export type KpiCardProps = {
  title: string
  value: string | number
  trend?: { value: number; label?: string }
  icon?: ReactNode
  iconVariant?: VariantProps<typeof kpiCardVariants>['variant']
  footer?: ReactNode
  sparklineData?: { value: number }[]
  sparklineColor?: string
  href?: string
  className?: string
  loading?: boolean
}

export function KpiCard({
  title,
  value,
  trend,
  icon,
  iconVariant = 'default',
  footer,
  sparklineData,
  sparklineColor = '#2563EB',
  href,
  className,
  loading = false,
}: KpiCardProps) {
  const TrendIcon = trend && trend.value > 0 ? ArrowUpRight : trend && trend.value < 0 ? ArrowDownRight : Minus

  const content = (
    <div className={cn(kpiCardVariants({ variant: iconVariant }), href && 'cursor-pointer hover:shadow-md', className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium text-muted truncate">{title}</p>
          <div className="mt-1.5 flex items-baseline gap-2">
            <p className="text-2xl font-bold tracking-tight tabular-nums text-base">
              {loading ? (
                <span className="inline-block h-7 w-24 rounded-md bg-slate-200 dark:bg-slate-700 animate-pulse" />
              ) : (
                value
              )}
            </p>
            {trend && !loading && (
              <span className={cn('inline-flex items-center gap-0.5 text-xs font-medium', trendColors[trend.value > 0 ? 'up' : trend.value < 0 ? 'down' : 'neutral'])}>
                <TrendIcon className="h-3 w-3" />
                {Math.abs(trend.value)}%
              </span>
            )}
          </div>
          {trend?.label && !loading && <p className="mt-1 text-[11px] text-muted">{trend.label}</p>}
        </div>

        {icon && !loading && (
          <div className={cn('h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0', iconContainerVariants[iconVariant || 'default'])}>
            {icon}
          </div>
        )}
      </div>

      {sparklineData && sparklineData.length > 1 && !loading && (
        <div className="mt-3 h-12 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={sparklineData}>
              <defs>
                <linearGradient id={`spark-${sparklineColor}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={sparklineColor} stopOpacity={0.2} />
                  <stop offset="100%" stopColor={sparklineColor} stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area type="monotone" dataKey="value" stroke={sparklineColor} strokeWidth={2} fill={`url(#spark-${sparklineColor})`} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {footer && !loading && <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700/50">{footer}</div>}
    </div>
  )

  if (href) {
    return (
      <a href={href} className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 rounded-xl">
        {content}
      </a>
    )
  }

  return content
}
