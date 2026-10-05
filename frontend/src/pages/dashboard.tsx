import { useQuery } from '@tanstack/react-query'
import { dashboardApi } from '@/api/dashboard.api'
import {
  DollarSign,
  TrendingUp,
  Users,
  Package,
  Wrench,
  CheckCircle,
  Clock,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { format } from 'date-fns'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import type { DashboardOverview, RepairTicket, Sale, Product } from '@/types'

const kpiCards = [
  { key: 'total', label: 'Total Revenue', icon: DollarSign, color: 'text-success', bg: 'bg-success/10' },
  { key: 'today', label: "Today's Revenue", icon: TrendingUp, color: 'text-info', bg: 'bg-info/10' },
  { key: 'month', label: 'Monthly Revenue', icon: DollarSign, color: 'text-primary', bg: 'bg-primary/10' },
]

export default function DashboardPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboard'],
    queryFn: dashboardApi.overview,
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (error || !data) {
    return <div className="text-danger">Failed to load dashboard</div>
  }

  const overview = data as DashboardOverview

  const revenueChartData = [
    { name: 'Total', value: overview.revenue.total },
    { name: 'Today', value: overview.revenue.today },
    { name: 'Month', value: overview.revenue.month },
    { name: 'Year', value: overview.revenue.year },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-sm text-muted">Here's what's happening today</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((card) => (
          <div key={card.key} className="bg-surface rounded-lg border border-slate-200 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted">{card.label}</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">
                  {overview.revenue[card.key as keyof typeof overview.revenue]?.toLocaleString() ?? 0} TND
                </p>
              </div>
              <div className={`h-10 w-10 rounded-lg ${card.bg} ${card.color} flex items-center justify-center`}>
                <card.icon className="h-5 w-5" />
              </div>
            </div>
          </div>
        ))}

        <div className="bg-surface rounded-lg border border-slate-200 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted">Customers</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{overview.customers.total}</p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <Users className="h-5 w-5" />
            </div>
          </div>
        </div>

        <div className="bg-surface rounded-lg border border-slate-200 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted">Products</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{overview.inventory.total_products}</p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-info/10 text-info flex items-center justify-center">
              <Package className="h-5 w-5" />
            </div>
          </div>
        </div>

        <div className="bg-surface rounded-lg border border-slate-200 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted">Active Repairs</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{overview.repairs.active}</p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-warning/10 text-warning flex items-center justify-center">
              <Wrench className="h-5 w-5" />
            </div>
          </div>
        </div>

        <div className="bg-surface rounded-lg border border-slate-200 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted">Completed Repairs</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{overview.repairs.completed}</p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-success/10 text-success flex items-center justify-center">
              <CheckCircle className="h-5 w-5" />
            </div>
          </div>
        </div>

        <div className="bg-surface rounded-lg border border-slate-200 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted">Pending Repairs</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{overview.repairs.pending}</p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-warning/10 text-warning flex items-center justify-center">
              <Clock className="h-5 w-5" />
            </div>
          </div>
        </div>

        <div className="bg-surface rounded-lg border border-slate-200 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted">Low Stock</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{overview.inventory.low_stock}</p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-danger/10 text-danger flex items-center justify-center">
              <AlertTriangle className="h-5 w-5" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-surface rounded-lg border border-slate-200 p-5">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Revenue Overview</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value: number) => `${value.toLocaleString()} TND`} />
                <Bar dataKey="value" fill="#2563EB" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-surface rounded-lg border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-900">Recent Repairs</h2>
              <Link to="/repairs" className="text-xs text-primary hover:underline flex items-center">
                View all <ArrowUpRight className="h-3 w-3 ml-1" />
              </Link>
            </div>
            <div className="space-y-3">
              {overview.recent_repairs.length === 0 ? (
                <p className="text-sm text-muted">No recent repairs</p>
              ) : (
                overview.recent_repairs.map((repair: RepairTicket) => (
                  <Link
                    key={repair.id}
                    to={`/repairs/${repair.id}`}
                    className="flex items-center justify-between p-3 rounded-md border border-slate-100 hover:border-primary/20 hover:bg-primary/5 transition-colors"
                  >
                    <div>
                      <p className="text-sm font-medium text-slate-900">{repair.ticket_number}</p>
                      <p className="text-xs text-muted">
                        {repair.customer.first_name} {repair.customer.last_name}
                      </p>
                    </div>
                    <span className="text-xs px-2 py-1 rounded-full bg-slate-100 text-slate-700 capitalize">
                      {repair.status_label}
                    </span>
                  </Link>
                ))
              )}
            </div>
          </div>

          <div className="bg-surface rounded-lg border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-900">Recent Sales</h2>
              <Link to="/sales" className="text-xs text-primary hover:underline flex items-center">
                View all <ArrowUpRight className="h-3 w-3 ml-1" />
              </Link>
            </div>
            <div className="space-y-3">
              {overview.recent_sales.length === 0 ? (
                <p className="text-sm text-muted">No recent sales</p>
              ) : (
                overview.recent_sales.map((sale: Sale) => (
                  <Link
                    key={sale.id}
                    to={`/sales/${sale.id}`}
                    className="flex items-center justify-between p-3 rounded-md border border-slate-100 hover:border-primary/20 hover:bg-primary/5 transition-colors"
                  >
                    <div>
                      <p className="text-sm font-medium text-slate-900">{sale.sale_number}</p>
                      <p className="text-xs text-muted">{sale.customer_name}</p>
                    </div>
                    <span className="text-sm font-semibold text-slate-900">{sale.total.toLocaleString()} TND</span>
                  </Link>
                ))
              )}
            </div>
          </div>

          <div className="bg-surface rounded-lg border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-900">Low Stock</h2>
              <Link to="/inventory/low-stock" className="text-xs text-danger hover:underline flex items-center">
                View all <ArrowDownRight className="h-3 w-3 ml-1" />
              </Link>
            </div>
            <div className="space-y-3">
              {overview.low_stock_products.length === 0 ? (
                <p className="text-sm text-muted">No low stock products</p>
              ) : (
                overview.low_stock_products.slice(0, 5).map((product: Product) => (
                  <Link
                    key={product.id}
                    to={`/products/${product.id}`}
                    className="flex items-center justify-between p-3 rounded-md border border-slate-100 hover:border-danger/20 hover:bg-danger/5 transition-colors"
                  >
                    <div>
                      <p className="text-sm font-medium text-slate-900">{product.name}</p>
                      <p className="text-xs text-muted">{product.sku}</p>
                    </div>
                    <span className="text-xs px-2 py-1 rounded-full bg-danger/10 text-danger font-medium">
                      {product.stock_quantity} left
                    </span>
                  </Link>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}