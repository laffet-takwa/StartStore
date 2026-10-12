import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { publicRepairsApi } from '@/api'
import { Search, Wrench } from 'lucide-react'
import { toast } from 'sonner'
import { LOGO_IMAGE } from '@/utils/images'
import { useI18n } from '@/i18n/context'

const STATUS_STEP: Record<string, number> = {
  received: 0,
  diagnosis: 1,
  waiting_customer: 1,
  approved: 2,
  repairing: 3,
  testing: 4,
  ready: 5,
  delivered: 6,
}

const STEP_LABELS = ['received', 'diagnosis', 'approved', 'repairing', 'testing', 'ready', 'delivered']

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

  const repair = (tracking as any)?.repair
  const device = (tracking as any)?.device
  const step = repair ? (STATUS_STEP[repair.status] ?? -1) : -1

  return (
    <div style={{ minHeight: '100%' }}>
      <div className="au cd st" style={{ maxWidth: 520, boxShadow: 'var(--sh)' }}>
        <img className="trl" src={LOGO_IMAGE} alt="STAR STORE" />
        <h2 className="hf" style={{ textAlign: 'center', fontSize: 22 }}>
          {t('tracking.title')}
        </h2>
        <p className="mu" style={{ marginBottom: 8 }}>{t('tracking.subtitle')}</p>

        <form onSubmit={handleSearch} className="row">
          <label className="sr" style={{ flex: 1 }}>
            <span className="si"><Search size={16} /></span>
            <input
              className="in"
              style={{ width: '100%' }}
              value={matricule}
              onChange={(e) => setMatricule(e.target.value)}
              placeholder={t('tracking.ticketNumber')}
            />
          </label>
          <button className="btn" type="submit" disabled={isLoading}>
            {isLoading ? t('common.loading') : t('tracking.track')}
          </button>
        </form>

        {error && <p className="msg er" style={{ marginTop: 14 }}>{t('tracking.noTicket')}</p>}

        {tracking && (
          <div style={{ marginTop: 8 }}>
            <div className="row" style={{ justifyContent: 'space-between', margin: '6px 0 10px' }}>
              <b className="hf" style={{ fontSize: 16 }}>
                <Wrench size={16} style={{ verticalAlign: '-2px', color: 'var(--ac)' }} /> {(tracking as any).matricule}
              </b>
              <span className="bd ok">{repair?.status_label}</span>
            </div>

            {step >= 0 && (
              <div className="tl">
                {STEP_LABELS.map((k, i) => (
                  <div key={k} className={i < step ? 'd' : i === step ? 'c' : ''}>
                    {t(`repairs.${k}`)}
                  </div>
                ))}
              </div>
            )}

            <div className="ln"><span>{t('tracking.device')}</span><b>{device?.brand} {device?.model}</b></div>
            <div className="ln"><span>{t('tracking.receivedAt')}</span><b>{new Date(repair?.received_at).toLocaleDateString()}</b></div>
            <div className="ln"><span>{t('tracking.lastUpdated')}</span><b>{new Date(repair?.last_updated).toLocaleString()}</b></div>
            {repair?.estimated_completion_date && (
              <div className="ln">
                <span>{t('tracking.estimatedCompletion')}</span>
                <b>{new Date(repair.estimated_completion_date).toLocaleDateString()}</b>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
