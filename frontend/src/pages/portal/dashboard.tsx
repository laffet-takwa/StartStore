import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import {
  Wrench,
  Monitor,
  Clock,
  CreditCard,
  Bell,
  ArrowUpRight,
} from 'lucide-react'
import { Card, CardBody, Badge } from '@/components/ui'
import { cn } from '@/utils/cn'
import { dashboardApi } from '@/api/dashboard.api'
import { useI18n } from '@/i18n/context'
import type { DashboardOverview } from '@/types'

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
}

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35 } },
}

export default function CustomerPortalDashboard() {
  const { t } = useI18n()
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => dashboardApi.overview,
  })

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-28 rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
        ))}
      </div>
    )
  }

  const overview = data as DashboardOverview | undefined

  const stats = [
    { labelKey: 'portal.activeRepair', value: overview?.repairs.active ?? 0, icon: Wrench, color: 'text-warning', bg: 'bg-warning/10', link: '/track' },
    { labelKey: 'portal.devices', value: overview?.inventory.total_products ?? 0, icon: Monitor, color: 'text-info', bg: 'bg-info/10', link: '/track' },
    { labelKey: 'portal.pendingPayments', value: overview?.customers.total ?? 0, icon: CreditCard, color: 'text-primary', bg: 'bg-primary/10', link: '/track' },
    { labelKey: 'portal.devices', value: overview?.inventory.low_stock ?? 0, icon: Bell, color: 'text-danger', bg: 'bg-danger/10', link: '/track' },
  ]

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
      <motion.div variants={itemVariants}>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{t('portal.dashboard')}</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{t('portal.activitySummary')}</p>
      </motion.div>

      <motion.div variants={containerVariants} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <motion.div key={stat.labelKey} variants={itemVariants}>
            <Link to={stat.link} className="block group">
              <Card hover className="h-full border-0 shadow-sm dark:bg-dark-surface-secondary">
                <CardBody className="p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">{t(stat.labelKey)}</p>
                      <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">{stat.value}</p>
                    </div>
                    <div className={cn('h-10 w-10 rounded-xl flex items-center justify-center', stat.bg, stat.color)}>
                      <stat.icon className="h-5 w-5" />
                    </div>
                  </div>
                </CardBody>
              </Card>
            </Link>
          </motion.div>
        ))}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div variants={itemVariants}>
          <Card className="border-0 shadow-sm">
            <CardBody className="p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-slate-900 dark:text-slate-100">{t('repairs.title')}</h3>
                <Link to="/portal/repairs" className="text-xs text-primary hover:text-primary-hover font-medium flex items-center gap-1">
                  {t('common.viewAll')} <ArrowUpRight className="h-3 w-3" />
                </Link>
              </div>
              <div className="space-y-2.5">
                {(overview?.recent_repairs || []).length === 0 ? (
                  <p className="text-sm text-slate-500 dark:text-slate-400">{t('repairs.noRepairs')}</p>
                ) : (
                  (overview?.recent_repairs || []).slice(0, 5).map((repair: any) => (
                    <Link
                      key={repair.id}
                      to={`/track?matricule=${repair.tracking_matricule}`}
                      className="flex items-center justify-between p-3 rounded-xl border border-slate-100 dark:border-slate-700/50 hover:border-primary/30 dark:hover:border-primary/40 hover:bg-primary-50/60 dark:hover:bg-dark-primary-light/20 transition-colors"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{repair.ticket_number}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                          <Clock className="h-3 w-3" />
                          {new Date(repair.received_at).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge variant={repair.status === 'ready' || repair.status === 'delivered' ? 'success' : 'info'} size="sm">
                        {repair.status_label}
                      </Badge>
                    </Link>
                  ))
                )}
              </div>
            </CardBody>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="border-0 shadow-sm">
            <CardBody className="p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-slate-900 dark:text-slate-100">{t('sales.title')}</h3>
                <Link to="/portal/orders" className="text-xs text-primary hover:text-primary-hover font-medium flex items-center gap-1">
                  {t('common.viewAll')} <ArrowUpRight className="h-3 w-3" />
                </Link>
              </div>
              <div className="space-y-2.5">
                {(overview?.recent_sales || []).length === 0 ? (
                  <p className="text-sm text-slate-500 dark:text-slate-400">{t('sales.noSales')}</p>
                ) : (
                  (overview?.recent_sales || []).slice(0, 5).map((sale: any) => (
                    <Link
                      key={sale.id}
                      to={`/track?order=${sale.sale_number}`}
                      className="flex items-center justify-between p-3 rounded-xl border border-slate-100 dark:border-slate-700/50 hover:border-primary/30 dark:hover:border-primary/40 hover:bg-primary-50/60 dark:hover:bg-dark-primary-light/20 transition-colors"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{sale.sale_number}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{sale.customer_name}</p>
                      </div>
                      <span className="text-sm font-semibold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                        {sale.total?.toLocaleString()} TND
                      </span>
                    </Link>
                  ))
                )}
              </div>
            </CardBody>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  )
}
