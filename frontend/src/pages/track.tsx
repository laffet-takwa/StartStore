import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { publicRepairsApi } from '@/api'
import { Search, Wrench, AlertCircle, Laptop, Smartphone, Tablet, Monitor } from 'lucide-react'
import { toast } from 'sonner'
import { Card, CardBody, Button } from '@/components/ui'
import { useI18n } from '@/i18n/context'

const deviceIcon: Record<string, React.ReactNode> = {
  laptop: <Laptop className="h-10 w-10 text-slate-400" />,
  desktop: <Monitor className="h-10 w-10 text-slate-400" />,
  phone: <Smartphone className="h-10 w-10 text-slate-400" />,
  tablet: <Tablet className="h-10 w-10 text-slate-400" />,
  other: <Monitor className="h-10 w-10 text-slate-400" />,
}

export default function TrackPage() {
  const { t } = useI18n()
  const [matricule, setMatricule] = useState('')
  const [searched, setSearched] = useState(false)
  const { data: tracking, isLoading, error } = useQuery({
    queryKey: ['public-tracking', matricule],
    queryFn: () => publicRepairsApi.track(matricule),
    enabled: searched && matricule.length > 0,
  })

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (!matricule.trim()) {
      toast.error(t('tracking.ticketNumber'))
      return
    }
    setSearched(true)
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto pt-12 pb-16 px-4">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center h-12 w-12 rounded-lg bg-primary/10 mb-4">
            <Wrench className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">{t('tracking.title')}</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2">{t('tracking.subtitle')}</p>
        </div>

        <Card>
          <CardBody>
            <form onSubmit={handleSearch} className="flex gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400 dark:text-slate-500" />
                <input
                  type="text"
                  value={matricule}
                  onChange={(e) => setMatricule(e.target.value)}
                  placeholder={t('tracking.ticketNumber') + '...'}
                  className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 bg-white dark:bg-dark-surface dark:border-slate-700 dark:text-slate-100"
                />
              </div>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? t('common.loading') : t('tracking.track')}
              </Button>
            </form>
          </CardBody>
        </Card>

        {error && (
          <Card className="mt-6">
            <CardBody>
              <div className="flex items-center gap-3 text-danger">
                <AlertCircle className="h-5 w-5" />
                <p className="text-sm">{t('tracking.noTicket')}</p>
              </div>
            </CardBody>
          </Card>
        )}

        {tracking && (
          <Card className="mt-6">
            <CardBody>
               <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{t('tracking.statusLabel')}</h2>
                <span className="text-sm text-slate-500 dark:text-slate-400">{(tracking as any).matricule}</span>
              </div>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-20 w-20 rounded-lg overflow-hidden border border-slate-200 bg-slate-50 flex items-center justify-center">
                    {deviceIcon[(tracking as any).device.type] || deviceIcon.other}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{(tracking as any).repair.status_label}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{t('tracking.lastUpdated')}: {new Date((tracking as any).repair.last_updated).toLocaleString()}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-slate-50 rounded-md">
                    <p className="text-xs text-slate-500 dark:text-slate-400">{t('tracking.device')}</p>
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{(tracking as any).device.brand} {(tracking as any).device.model}</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-md">
                    <p className="text-xs text-slate-500 dark:text-slate-400">{t('tracking.receivedAt')}</p>
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{new Date((tracking as any).repair.received_at).toLocaleDateString()}</p>
                  </div>
                </div>
                {(tracking as any).repair.estimated_completion_date && (
                  <div className="p-3 bg-info/5 rounded-md">
                    <p className="text-xs text-slate-500 dark:text-slate-400">{t('tracking.estimatedCompletion')}</p>
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{new Date((tracking as any).repair.estimated_completion_date).toLocaleDateString()}</p>
                  </div>
                )}
              </div>
            </CardBody>
          </Card>
        )}
      </div>
    </div>
  )
}
