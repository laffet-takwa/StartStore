import { useQuery } from '@tanstack/react-query'
import { dashboardApi } from '@/api/dashboard.api'
import { Wrench, ShoppingCart, Monitor, Users } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Card, CardBody, Badge } from '@/components/ui'
import type { DashboardOverview } from '@/types'

export default function CustomerPortalDashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: dashboardApi.overview,
  })

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-32 rounded-xl bg-slate-100 animate-pulse" />
        ))}
      </div>
    )
  }

  const overview = data as DashboardOverview | undefined

  const stats = [
    { label: 'Active Repairs', value: overview?.repairs.active ?? 0, icon: Wrench, color: 'text-warning', bg: 'bg-warning/10', link: '/track' },
    { label: 'Total Customers', value: overview?.customers.total ?? 0, icon: Users, color: 'text-primary', bg: 'bg-primary/10', link: '/track' },
    { label: 'Products', value: overview?.inventory.total_products ?? 0, icon: Monitor, color: 'text-info', bg: 'bg-info/10', link: '/track' },
    { label: 'Low Stock', value: overview?.inventory.low_stock ?? 0, icon: ShoppingCart, color: 'text-danger', bg: 'bg-danger/10', link: '/track' },
  ]

  return (
    <div className="space-y-6 page-enter">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">My Dashboard</h1>
        <p className="text-sm text-muted">Welcome back! Here's your overview.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Link key={stat.label} to={stat.link} className="block">
            <Card hover className="h-full">
              <CardBody>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted uppercase tracking-wide">{stat.label}</p>
                    <p className="text-2xl font-bold text-slate-900 mt-1">{stat.value}</p>
                  </div>
                  <div className={`h-10 w-10 rounded-lg ${stat.bg} ${stat.color} flex items-center justify-center`}>
                    <stat.icon className="h-5 w-5" />
                  </div>
                </div>
              </CardBody>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardBody>
            <h3 className="font-semibold text-slate-900 mb-4">Recent Repairs</h3>
            <div className="space-y-3">
              {(overview?.recent_repairs || []).length === 0 ? (
                <p className="text-sm text-muted">No repairs yet</p>
              ) : (
                (overview?.recent_repairs || []).slice(0, 5).map((repair: any) => (
                  <Link
                    key={repair.id}
                    to={`/track?matricule=${repair.tracking_matricule}`}
                    className="block p-3 rounded-lg border border-slate-100 hover:border-primary/20 hover:bg-primary/5 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-slate-900">{repair.ticket_number}</p>
                        <p className="text-xs text-muted">{repair.device?.brand} {repair.device?.model}</p>
                      </div>
                      <Badge variant={repair.status === 'ready' || repair.status === 'delivered' ? 'success' : 'info'}>
                        {repair.status_label}
                      </Badge>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <h3 className="font-semibold text-slate-900 mb-4">Recent Sales</h3>
            <div className="space-y-3">
              {(overview?.recent_sales || []).length === 0 ? (
                <p className="text-sm text-muted">No sales yet</p>
              ) : (
                (overview?.recent_sales || []).slice(0, 5).map((sale: any) => (
                  <Link
                    key={sale.id}
                    to={`/track?order=${sale.sale_number}`}
                    className="block p-3 rounded-lg border border-slate-100 hover:border-primary/20 hover:bg-primary/5 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-slate-900">{sale.sale_number}</p>
                        <p className="text-xs text-muted">{sale.customer_name}</p>
                      </div>
                      <span className="text-sm font-semibold text-slate-900">{sale.total?.toLocaleString()} TND</span>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  )
}
