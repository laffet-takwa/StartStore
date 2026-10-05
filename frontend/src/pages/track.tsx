import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { publicRepairsApi } from '@/api'
import { Search, Wrench, CheckCircle, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'

export default function TrackPage() {
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
      toast.error('Please enter a tracking number')
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
          <h1 className="text-3xl font-bold text-slate-900">Track Your Repair</h1>
          <p className="text-muted mt-2">Enter your tracking matricule to check repair status</p>
        </div>

        <form onSubmit={handleSearch} className="bg-surface rounded-lg border border-slate-200 p-6 mb-6">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted" />
              <input
                type="text"
                value={matricule}
                onChange={(e) => setMatricule(e.target.value)}
                placeholder="Enter tracking number..."
                className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <button type="submit" disabled={isLoading} className="px-4 py-2 bg-primary text-white rounded-md text-sm font-medium hover:bg-primary/90 disabled:opacity-50">
              {isLoading ? 'Searching...' : 'Track'}
            </button>
          </div>
        </form>

        {error && (
          <div className="bg-danger/5 border border-danger/20 rounded-lg p-4 text-center">
            <AlertCircle className="h-8 w-8 text-danger mx-auto mb-2" />
            <p className="text-sm text-danger">Repair not found. Please check the tracking number.</p>
          </div>
        )}

        {tracking && (
          <div className="bg-surface rounded-lg border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-900">Repair Status</h2>
              <span className="text-sm text-muted">{(tracking as any).matricule}</span>
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-success" />
                <div>
                  <p className="text-sm font-medium text-slate-900">{(tracking as any).repair.status_label}</p>
                  <p className="text-xs text-muted">Last updated: {new Date((tracking as any).repair.last_updated).toLocaleString()}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 rounded-md">
                  <p className="text-xs text-muted">Device</p>
                  <p className="text-sm font-medium text-slate-900">{(tracking as any).device.brand} {(tracking as any).device.model}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-md">
                  <p className="text-xs text-muted">Received</p>
                  <p className="text-sm font-medium text-slate-900">{new Date((tracking as any).repair.received_at).toLocaleDateString()}</p>
                </div>
              </div>
              {(tracking as any).repair.estimated_completion_date && (
                <div className="p-3 bg-info/5 rounded-md">
                  <p className="text-xs text-muted">Estimated Completion</p>
                  <p className="text-sm font-medium text-slate-900">{new Date((tracking as any).repair.estimated_completion_date).toLocaleDateString()}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
