import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { repairsApi } from '@/api'
import { ArrowLeft, Clock, Wrench, User, Image, Package } from 'lucide-react'
import type { RepairTicket, RepairStatusHistory, RepairPart, RepairImage } from '@/types'

const statusColors: Record<string, string> = {
  received: 'bg-slate-100 text-slate-700',
  diagnosis: 'bg-info/10 text-info',
  waiting_customer: 'bg-warning/10 text-warning',
  approved: 'bg-primary/10 text-primary',
  repairing: 'bg-warning/10 text-warning',
  testing: 'bg-info/10 text-info',
  ready: 'bg-success/10 text-success',
  delivered: 'bg-success/10 text-success',
  cancelled: 'bg-danger/10 text-danger',
}

export default function RepairDetailPage() {
  const { id } = useParams()
  const { data: repair, isLoading } = useQuery({
    queryKey: ['repair', id],
    queryFn: () => repairsApi.get(id!),
    enabled: !!id,
  })

  if (isLoading || !repair) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const r = repair as RepairTicket
  const history = r.status_history || []
  const parts = r.parts || []
  const images = r.images || []

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/repairs" className="p-2 hover:bg-slate-100 rounded-md">
          <ArrowLeft className="h-5 w-5 text-slate-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{r.ticket_number}</h1>
          <p className="text-sm text-muted">Repair Details</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-surface rounded-lg border border-slate-200 p-5">
            <h3 className="font-semibold text-slate-900 mb-4">Customer & Device</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <User className="h-4 w-4 text-muted" />
                <span className="text-slate-600">{r.customer.first_name} {r.customer.last_name}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Wrench className="h-4 w-4 text-muted" />
                <span className="text-slate-600">{r.device.brand} {r.device.model}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-muted" />
                <span className="text-slate-600">Received {new Date(r.received_at).toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div className="bg-surface rounded-lg border border-slate-200 p-5">
            <h3 className="font-semibold text-slate-900 mb-2">Current Status</h3>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[r.status] || 'bg-slate-100 text-slate-700'}`}>
              {r.status_label}
            </span>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="bg-surface rounded-lg border border-slate-200 p-5">
            <h3 className="font-semibold text-slate-900 mb-4">Description</h3>
            <p className="text-sm text-slate-600">{r.problem_description}</p>
            {r.diagnosis && <div className="mt-3"><p className="text-sm font-medium text-slate-700">Diagnosis:</p><p className="text-sm text-slate-600">{r.diagnosis}</p></div>}
            {r.repair_solution && <div className="mt-3"><p className="text-sm font-medium text-slate-700">Solution:</p><p className="text-sm text-slate-600">{r.repair_solution}</p></div>}
          </div>

          <div className="bg-surface rounded-lg border border-slate-200 p-5">
            <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2"><Package className="h-4 w-4" /> Parts Used</h3>
            {parts.length === 0 ? (
              <p className="text-sm text-muted">No parts used.</p>
            ) : (
              <div className="space-y-2">
                {parts.map((part: RepairPart) => (
                  <div key={part.id} className="flex items-center justify-between p-2 rounded border border-slate-100">
                    <span className="text-sm text-slate-600">{part.product.name}</span>
                    <span className="text-sm text-slate-600">x{part.quantity} - {(part.total_price).toLocaleString()} TND</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-surface rounded-lg border border-slate-200 p-5">
            <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2"><Image className="h-4 w-4" /> Images</h3>
            {images.length === 0 ? (
              <p className="text-sm text-muted">No images.</p>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {images.map((img: RepairImage) => (
                  <img key={img.id} src={img.image} alt={img.caption || 'Repair image'} className="w-full h-32 object-cover rounded-md" />
                ))}
              </div>
            )}
          </div>

          <div className="bg-surface rounded-lg border border-slate-200 p-5">
            <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2"><Clock className="h-4 w-4" /> Status Timeline</h3>
            <div className="space-y-3">
              {history.map((h: RepairStatusHistory) => (
                <div key={h.id} className="flex items-start gap-3">
                  <div className="mt-1">
                    <div className="h-2 w-2 rounded-full bg-primary"></div>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">{h.old_status_label ? `${h.old_status_label} → ` : ''}{h.new_status_label}</p>
                    {h.note && <p className="text-xs text-muted">{h.note}</p>}
                    <p className="text-xs text-muted">{new Date(h.created_at).toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
