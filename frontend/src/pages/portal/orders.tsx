import { motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { salesApi, invoicesApi } from '@/api'
import { ShoppingCart, FileText, ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Card, CardBody, Badge, EmptyState } from '@/components/ui'
import { useI18n } from '@/i18n/context'

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
}

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35 } },
}

export default function CustomerPortalOrders() {
  const { t } = useI18n()
  const { data: sales, isLoading: salesLoading } = useQuery({
    queryKey: ['customer-orders'],
    queryFn: () => salesApi.list({ page_size: 50 }),
  })

  const { data: invoices, isLoading: invoicesLoading } = useQuery({
    queryKey: ['customer-invoices'],
    queryFn: () => invoicesApi.list({ page_size: 50 }),
  })

  const orders = (sales as any)?.results || []
  const invoiceList = (invoices as any)?.results || []

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
      <motion.div variants={itemVariants}>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{t('sales.title')}</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">{t('sales.subtitle')}</p>
      </motion.div>

      {salesLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-24 rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <Card>
          <CardBody>
            <EmptyState title={t('sales.noSales')} description={t('sales.createSaleHint')} />
          </CardBody>
        </Card>
      ) : (
        <motion.div variants={containerVariants} className="space-y-3">
          {orders.map((order: any) => (
            <motion.div key={order.id} variants={itemVariants}>
              <Link to={`/track?order=${order.sale_number}`} className="block">
                <Card hover>
                  <CardBody>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                          <ShoppingCart className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{order.sale_number}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">{new Date(order.created_at).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{order.total?.toLocaleString()} TND</p>
                          <Badge variant={
                            order.payment_status === 'paid' ? 'success' :
                            order.payment_status === 'partial' ? 'warning' :
                            order.payment_status === 'refunded' ? 'danger' : 'default'
                          }>
                            {order.payment_status_label || order.payment_status}
                          </Badge>
                        </div>
                        <ChevronRight className="h-4 w-4 text-slate-400" />
                      </div>
                    </div>
                  </CardBody>
                </Card>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      )}

      {invoicesLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="h-20 rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
          ))}
        </div>
      ) : invoiceList.length > 0 && (
        <motion.div variants={itemVariants}>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">{t('invoices.title')}</h2>
          <div className="space-y-3">
            {invoiceList.slice(0, 5).map((invoice: any) => (
              <Card key={invoice.id} hover>
                <CardBody>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-info/10 text-info flex items-center justify-center">
                        <FileText className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{invoice.invoice_number}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{new Date(invoice.issued_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{invoice.total?.toLocaleString()} TND</p>
                    </div>
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        </motion.div>
      )}
    </motion.div>
  )
}
