import { motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { invoicesApi } from '@/api'
import { FileText, Download } from 'lucide-react'
import { Card, CardBody, Button, EmptyState } from '@/components/ui'
import { useI18n } from '@/i18n/context'

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
}

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35 } },
}

export default function CustomerPortalInvoices() {
  const { t } = useI18n()
  const { data, isLoading } = useQuery({
    queryKey: ['customer-invoices-portal'],
    queryFn: () => invoicesApi.list({ page_size: 50 }),
  })

  const invoices = (data as any)?.results || []

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
      <motion.div variants={itemVariants}>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{t('invoices.title')}</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">{t('invoices.subtitle')}</p>
      </motion.div>

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-24 rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
          ))}
        </div>
      ) : invoices.length === 0 ? (
        <Card>
          <CardBody>
            <EmptyState title={t('invoices.noInvoices')} description="Your invoices will appear here." />
          </CardBody>
        </Card>
      ) : (
        <motion.div variants={containerVariants} className="space-y-3">
          {invoices.map((invoice: any) => (
            <motion.div key={invoice.id} variants={itemVariants}>
              <Card hover>
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
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{invoice.total?.toLocaleString()} TND</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{invoice.customer?.first_name} {invoice.customer?.last_name}</p>
                      </div>
                      <Button variant="ghost" size="sm" icon={<Download className="h-4 w-4" />}>
                        {t('common.download')}
                      </Button>
                    </div>
                  </div>
                </CardBody>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      )}
    </motion.div>
  )
}
