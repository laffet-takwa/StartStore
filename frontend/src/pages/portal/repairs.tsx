import { useQuery } from '@tanstack/react-query'
import { repairsApi } from '@/api'
import { Wrench, Clock, ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Card, CardBody, Badge, EmptyState } from '@/components/ui'

export default function CustomerPortalRepairs() {
  const { data, isLoading } = useQuery({
    queryKey: ['customer-repairs'],
    queryFn: () => repairsApi.list({ page_size: 50 }),
  })

  const repairs = (data as any)?.results || []

  return (
    <div className="space-y-6 page-enter">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">My Repairs</h1>
        <p className="text-sm text-muted">Track your repair status</p>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-24 rounded-xl bg-slate-100 animate-pulse" />
          ))}
        </div>
      ) : repairs.length === 0 ? (
        <Card>
          <CardBody>
            <EmptyState title="No repairs yet" description="Your repair tickets will appear here." />
          </CardBody>
        </Card>
      ) : (
        <div className="space-y-3">
          {repairs.map((repair: any) => (
            <Link key={repair.id} to={`/track?matricule=${repair.tracking_matricule}`} className="block">
              <Card hover>
                <CardBody>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-warning/10 text-warning flex items-center justify-center">
                        <Wrench className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-900">{repair.ticket_number}</p>
                        <p className="text-xs text-muted">{repair.device?.brand} {repair.device?.model}</p>
                        <p className="text-xs text-muted flex items-center gap-1 mt-0.5">
                          <Clock className="h-3 w-3" />
                          {new Date(repair.received_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={
                        repair.status === 'ready' || repair.status === 'delivered' ? 'success' :
                        repair.status === 'cancelled' ? 'danger' : 'info'
                      }>
                        {repair.status_label}
                      </Badge>
                      <ChevronRight className="h-4 w-4 text-muted" />
                    </div>
                  </div>
                </CardBody>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
