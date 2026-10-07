import { useQuery } from '@tanstack/react-query'
import { dashboardApi } from '@/api/dashboard.api'
import {
  DollarSign,
  TrendingUp,
  Users,
  Package,
  Wrench,
  ShoppingCart,
  ArrowUpRight,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import {
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts'
import { KpiCard } from '@/components/ui'
import { DashboardSkeleton } from '@/components/ui/skeleton'
import { DataTable } from '@/components/ui/data-table'
import { EmptyState } from '@/components/ui/state'
import { Badge } from '@/components/ui'
import { cn } from '@/utils/cn'
import type { DashboardOverview, RepairTicket, Product } from '@/types'

export default function DashboardPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboard'],
    queryFn: dashboardApi.overview,
  })

  if (isLoading) {
    return <DashboardSkeleton />
  }

  if (error || !data) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <p className="text-sm text-danger font-medium">Failed to load dashboard</p>
          <p className="text-xs text-muted mt-1">Please try again later</p>
        </div>
      </div>
    )
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

  const recentRepairsColumns = [
    { key: 'ticket', header: 'Ticket', render: (row: RepairTicket) => <Link to={`/repairs/${row.id}`} className="font-medium text-primary hover:underline">{row.ticket_number}</Link> },
    { key: 'customer', header: 'Customer', render: (row: RepairTicket) => `${row.customer.first_name} ${row.customer.last_name}` },
    { key: 'device', header: 'Device', render: (row: RepairTicket) => `${row.device.brand} ${row.device.model}` },
    { key: 'technician', header: 'Technician', render: (row: RepairTicket) => row.technician?.full_name || '-' },
    { key: 'status', header: 'Status', render: (row: RepairTicket) => {
      const colors: Record<string, 'default' | 'secondary' | 'success' | 'warning' | 'danger' | 'info' | 'primary'> = { received: 'secondary', diagnosis: 'warning', waiting_customer: 'warning', approved: 'info', repairing: 'primary', testing: 'info', ready: 'success', delivered: 'default', cancelled: 'danger' }
      return <Badge variant={colors[row.status] || 'secondary'}>{row.status_label}</Badge>
    }},
    { key: 'updated', header: 'Updated', render: (row: RepairTicket) => new Date(row.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) },
  ]

  return (
    <div className="space-y-6 page-enter max-w-[1440px] mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Dashboard</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Here's what's happening with STAR STORE today.</p>
        </div>
        <div className="flex items-center gap-2">
          {quickActions.map((action) => (
            <Link
              key={action.label}
              to={action.href}
              className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors border border-slate-200 dark:border-slate-700 hover:border-primary/30 dark:hover:border-primary/40 hover:bg-primary-50 dark:hover:bg-dark-primary-light"
            >
              <action.icon className="h-4 w-4" />
              {action.label}
            </Link>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Total Revenue"
          value={`${overview.revenue.total.toLocaleString()} DT`}
          trend={{ value: 12.5, label: 'vs last month' }}
          icon={<DollarSign className="h-5 w-5" />}
          iconVariant="primary"
          href="/reports"
          sparklineData={[
            { value: 18000 }, { value: 22000 }, { value: 19500 }, { value: 25000 },
            { value: 28000 }, { value: 26000 }, { value: overview.revenue.total },
          ]}
          sparklineColor="#2563EB"
        />
        <KpiCard
          title="Today's Revenue"
          value={`${overview.revenue.today.toLocaleString()} DT`}
          trend={{ value: 8.2, label: 'vs yesterday' }}
          icon={<TrendingUp className="h-5 w-5" />}
          iconVariant="success"
          href="/reports"
          sparklineData={[
            { value: 1200 }, { value: 1400 }, { value: 1300 }, { value: 1600 },
            { value: 1500 }, { value: 1700 }, { value: overview.revenue.today },
          ]}
          sparklineColor="#16A34A"
        />
        <KpiCard
          title="Active Repairs"
          value={overview.repairs.active}
          trend={{ value: 4.1 }}
          icon={<Wrench className="h-5 w-5" />}
          iconVariant="warning"
          href="/repairs"
          footer={<p className="text-xs text-slate-500 dark:text-slate-400">{overview.repairs.pending} pending • {overview.repairs.ready} ready</p>}
        />
        <KpiCard
          title="Total Customers"
          value={overview.customers.total.toLocaleString()}
          trend={{ value: 6.3, label: 'new this month' }}
          icon={<Users className="h-5 w-5" />}
          iconVariant="info"
          href="/customers"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-xl border border-slate-200 dark:border-dark-border bg-surface dark:bg-dark-surface p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">Revenue Overview</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Your revenue performance over the selected period.</p>
            </div>
            <div className="flex items-center gap-1 rounded-lg border border-slate-200 dark:border-slate-700 p-0.5">
              {['7D', '30D', '90D'].map((period) => (
                <button
                  key={period}
                  className={cn(
                    'px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors',
                    period === '30D' ? 'bg-slate-900 dark:bg-slate-700 text-white' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  )}
                >
                  {period}
                </button>
              ))}
            </div>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueChartData}>
                <defs>
                  <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2563EB" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="#2563EB" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" className="dark:stroke-slate-700" />
                <XAxis dataKey="name" stroke="#64748B" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748B" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip
                  formatter={(value: any) => [`${Number(value).toLocaleString()} DT`, 'Revenue']}
                  contentStyle={{ borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.08)' }}
                  cursor={{ fill: 'rgba(37, 99, 235, 0.04)' }}
                />
                <Area type="monotone" dataKey="value" stroke="#2563EB" strokeWidth={2} fill="url(#revenueGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-dark-border bg-surface dark:bg-dark-surface p-5">
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100 mb-1">Repairs Overview</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Current status of all repair tickets.</p>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={repairsChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={70}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {repairsChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: any) => [`${value} repairs`, '']} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 space-y-2.5">
            {repairsChartData.map((item) => (
              <div key={item.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-slate-600 dark:text-slate-300">{item.name}</span>
                </div>
                <span className="font-semibold text-slate-900 dark:text-slate-100 tabular-nums">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-xl border border-slate-200 dark:border-dark-border bg-surface dark:bg-dark-surface">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-dark-border">
            <div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">Recent Repairs</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Latest repair tickets in the system.</p>
            </div>
            <Link to="/repairs" className="text-xs text-primary hover:text-primary-hover font-medium flex items-center gap-1">
              View all <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="p-0">
            {overview.recent_repairs.length === 0 ? (
              <div className="py-12">
                <EmptyState title="No repairs yet" description="Create a repair ticket to start tracking customer devices." action={{ label: 'New Repair', onClick: () => window.location.href = '/repairs/new' }} />
              </div>
            ) : (
              <DataTable
                columns={recentRepairsColumns}
                data={overview.recent_repairs}
                keyExtractor={(row) => row.id}
                pageSize={5}
                mobileCard={(row: RepairTicket) => (
                  <Link to={`/repairs/${row.id}`} className="block p-4 active:bg-slate-50 dark:active:bg-dark-surface-secondary">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-primary">{row.ticket_number}</span>
                      <Badge variant={row.status === 'ready' ? 'success' : row.status === 'repairing' ? 'primary' : row.status === 'testing' ? 'info' : 'warning'}>{row.status_label}</Badge>
                    </div>
                     <div className="space-y-1">
                       <p className="text-sm text-slate-700 dark:text-slate-200">{row.customer.first_name} {row.customer.last_name}</p>
                       <p className="text-xs text-slate-500 dark:text-slate-400">{row.device.brand} {row.device.model}</p>
                       <p className="text-xs text-slate-400">{row.technician?.full_name || 'Unassigned'}</p>
                     </div>
                  </Link>
                )}
              />
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-xl border border-slate-200 dark:border-dark-border bg-surface dark:bg-dark-surface">
            <div className="px-5 py-4 border-b border-slate-200 dark:border-dark-border">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">Low Stock</h2>
                <Link to="/inventory/low-stock" className="text-xs text-danger hover:text-danger/80 font-medium flex items-center gap-1">
                  View all
                </Link>
              </div>
            </div>
            <div className="p-3">
              {overview.low_stock_products.length === 0 ? (
                <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-6">All products in stock</p>
              ) : (
                <div className="space-y-1.5">
                  {overview.low_stock_products.slice(0, 5).map((product: Product) => (
                    <Link
                      key={product.id}
                      to={`/products/${product.id}`}
                      className="flex items-center justify-between p-3 rounded-lg border border-slate-100 dark:border-slate-700/50 hover:border-danger/30 dark:hover:border-danger/40 hover:bg-danger-50/60 dark:hover:bg-dark-danger-light/20 transition-colors"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">{product.name}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{product.sku}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-16 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-danger"
                            style={{ width: `${Math.min(100, (product.stock_quantity / product.minimum_stock) * 100)}%` }}
                          />
                        </div>
                        <span className="text-xs font-medium text-danger whitespace-nowrap">{product.stock_quantity}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 dark:border-dark-border bg-surface dark:bg-dark-surface">
            <div className="px-5 py-4 border-b border-slate-200 dark:border-dark-border">
              <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">Quick Actions</h2>
            </div>
            <div className="p-3">
              <div className="grid grid-cols-2 gap-2">
                {quickActions.map((action) => (
                  <Link
                    key={action.label}
                    to={action.href}
                    className={cn('flex items-center gap-2 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 transition-colors', action.color)}
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
    </div>
  )
}
