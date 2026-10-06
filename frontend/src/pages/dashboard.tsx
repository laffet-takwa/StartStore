import { useQuery } from '@tanstack/react-query'
import { dashboardApi } from '@/api/dashboard.api'
import {
  DollarSign,
  TrendingUp,
  Users,
  Package,
  Wrench,
  CheckCircle,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  ShoppingCart,
  BarChart3,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import type { DashboardOverview, RepairTicket, Product } from '@/types'

const kpiCards = [
  { key: 'total', label: 'Total Revenue', icon: DollarSign, color: 'text-success', bg: 'bg-success/10', href: '/reports' },
  { key: 'today', label: "Today's Revenue", icon: TrendingUp, color: 'text-info', bg: 'bg-info/10', href: '/reports' },
  { key: 'month', label: 'Monthly Revenue', icon: DollarSign, color: 'text-primary', bg: 'bg-primary/10', href: '/reports' },
]

export default function DashboardPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboard'],
    queryFn: dashboardApi.overview,
  })

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-32 rounded-xl bg-slate-100 animate-pulse" />
          ))}
        </div>
        <div className="h-96 rounded-xl bg-slate-100 animate-pulse" />
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

  const repairsChartData = [
    { name: 'Active', value: overview.repairs.active, color: '#2563EB' },
    { name: 'Pending', value: overview.repairs.pending, color: '#F59E0B' },
    { name: 'In Progress', value: overview.repairs.in_progress, color: '#0284C7' },
    { name: 'Ready', value: overview.repairs.ready, color: '#16A34A' },
    { name: 'Completed', value: overview.repairs.completed, color: '#64748B' },
  ]

  const quickActions = [
    { label: 'New Repair', href: '/repairs/new', icon: Wrench, color: 'text-primary bg-primary/10 hover:bg-primary/20' },
    { label: 'New Sale', href: '/sales/new', icon: ShoppingCart, color: 'text-success bg-success/10 hover:bg-success/20' },
    { label: 'Add Product', href: '/products/new', icon: Package, color: 'text-info bg-info/10 hover:bg-info/20' },
    { label: 'Add Customer', href: '/customers/new', icon: Users, color: 'text-warning bg-warning/10 hover:bg-warning/20' },
  ]

  return (
    <div className="space-y-6 page-enter">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-sm text-muted">Here's what's happening with STAR STORE today.</p>
        </div>
        <div className="flex items-center gap-2">
          {quickActions.map((action) => (
            <Link
              key={action.label}
              to={action.href}
              className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors border border-slate-200 hover:border-primary/20 hover:bg-primary/5"
            >
              <action.icon className="h-4 w-4" />
              {action.label}
            </Link>
          ))}
          <Link to="/reports" className="hidden md:flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border border-slate-200 hover:border-primary/20 hover:bg-primary/5">
            <BarChart3 className="h-4 w-4" />
            Reports
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((card, idx) => (
          <Link
            key={card.key}
            to={card.href}
            className="bg-surface rounded-xl border border-slate-200 p-5 card-hover"
            style={{ animationDelay: `${idx * 60}ms`, animationFillMode: 'both' }}
          >
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
          </Link>
        ))}

        <div className="bg-surface rounded-xl border border-slate-200 p-5 card-hover" style={{ animationDelay: '120ms', animationFillMode: 'both' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted">Repairs</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{overview.repairs.active}</p>
              <p className="text-xs text-muted mt-1">{overview.repairs.pending} pending</p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-warning/10 text-warning flex items-center justify-center">
              <Wrench className="h-5 w-5" />
            </div>
          </div>
        </div>

        <div className="bg-surface rounded-xl border border-slate-200 p-5 card-hover" style={{ animationDelay: '160ms', animationFillMode: 'both' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted">Customers</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{overview.customers.total}</p>
              <p className="text-xs text-muted mt-1">+{overview.customers.new_this_month} this month</p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <Users className="h-5 w-5" />
            </div>
          </div>
        </div>

        <div className="bg-surface rounded-xl border border-slate-200 p-5 card-hover" style={{ animationDelay: '200ms', animationFillMode: 'both' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted">Products</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{overview.inventory.total_products}</p>
              <p className="text-xs text-danger mt-1">{overview.inventory.low_stock} low stock</p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-info/10 text-info flex items-center justify-center">
              <Package className="h-5 w-5" />
            </div>
          </div>
        </div>

        <div className="bg-surface rounded-xl border border-slate-200 p-5 card-hover" style={{ animationDelay: '240ms', animationFillMode: 'both' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted">Completed Repairs</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{overview.repairs.completed}</p>
              <p className="text-xs text-muted mt-1">{overview.repairs.ready} ready for pickup</p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-success/10 text-success flex items-center justify-center">
              <CheckCircle className="h-5 w-5" />
            </div>
          </div>
        </div>

        <div className="bg-surface rounded-xl border border-slate-200 p-5 card-hover" style={{ animationDelay: '280ms', animationFillMode: 'both' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted">Low Stock</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{overview.inventory.low_stock}</p>
              <p className="text-xs text-danger mt-1">{overview.inventory.out_of_stock} out of stock</p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-danger/10 text-danger flex items-center justify-center">
              <AlertTriangle className="h-5 w-5" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-surface rounded-xl border border-slate-200 p-5">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Revenue Overview</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="name" stroke="#64748B" fontSize={12} />
                <YAxis stroke="#64748B" fontSize={12} />
                <Tooltip
                  formatter={(value) => [`${Number(value).toLocaleString()} TND`, 'Revenue']}
                  contentStyle={{ borderRadius: '8px', border: '1px solid #E2E8F0' }}
                  cursor={{ fill: 'rgba(37, 99, 235, 0.05)' }}
                />
                <Bar dataKey="value" fill="#2563EB" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-surface rounded-xl border border-slate-200 p-5">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Repairs Overview</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={repairsChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {repairsChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value} repairs`, '']} />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-4 space-y-2">
              {repairsChartData.map((item) => (
                <div key={item.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-muted">{item.name}</span>
                  </div>
                  <span className="font-medium text-slate-900">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-surface rounded-xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900">Recent Repairs</h2>
            <Link to="/repairs" className="text-xs text-primary hover:underline flex items-center">
              View all <ArrowUpRight className="h-3 w-3 ml-1" />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="text-left px-4 py-3 font-medium text-slate-600">Ticket</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">Customer</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">Device</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">Technician</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">Status</th>
                  <th className="text-right px-4 py-3 font-medium text-slate-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {overview.recent_repairs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-muted">No recent repairs</td>
                  </tr>
                ) : (
                  overview.recent_repairs.map((repair: RepairTicket) => (
                    <tr key={repair.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <Link to={`/repairs/${repair.id}`} className="font-medium text-slate-900 hover:text-primary">
                          {repair.ticket_number}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {repair.customer.first_name} {repair.customer.last_name}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {repair.device.brand} {repair.device.model}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {repair.technician?.full_name || '-'}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          repair.status === 'ready' ? 'bg-success-light text-success' :
                          repair.status === 'repairing' ? 'bg-primary-light text-primary' :
                          repair.status === 'testing' ? 'bg-info-light text-info' :
                          repair.status === 'delivered' ? 'bg-slate-100 text-slate-700' :
                          'bg-warning-light text-warning'
                        }`}>
                          {repair.status_label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link to={`/repairs/${repair.id}`} className="p-2 hover:bg-slate-100 rounded-lg inline-flex items-center justify-center">
                          <ArrowUpRight className="h-4 w-4 text-slate-600" />
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-surface rounded-xl border border-slate-200 p-5">
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
                    className="flex items-center justify-between p-3 rounded-lg border border-slate-100 hover:border-danger/20 hover:bg-danger/5 transition-colors"
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

          <div className="bg-surface rounded-xl border border-slate-200 p-5">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Quick Actions</h2>
            <div className="grid grid-cols-2 gap-3">
              {quickActions.map((action) => (
                <Link
                  key={action.label}
                  to={action.href}
                  className={`flex items-center gap-2 p-3 rounded-lg border border-slate-200 transition-colors ${action.color}`}
                >
                  <action.icon className="h-4 w-4" />
                  <span className="text-sm font-medium">{action.label}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}