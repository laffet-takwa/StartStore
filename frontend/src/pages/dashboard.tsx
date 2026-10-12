import { useQuery } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { dashboardApi } from '@/api/dashboard.api'
import {
  TrendingUp,
  Users,
  Package,
  Wrench,
  ShoppingCart,
  Wallet,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import {
  AreaChart,
  Area,
  ResponsiveContainer,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts'
import { DashboardSkeleton } from '@/components/ui/skeleton'
import type { DashboardOverview, Product } from '@/types'

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

  const repairsBreakdown = (overview.repairs_by_status || []).filter((r) => r.count > 0)
  const repairsTotal = repairsBreakdown.reduce((a, b) => a + b.count, 0) || 1

  const money = (v: number) => `${v.toLocaleString('en-US', { maximumFractionDigits: 0 })} DT`

  const weekdayLabel = (iso: string) =>
    new Date(iso).toLocaleDateString('en-US', { weekday: 'short' })

  const revenueChartData = (overview.revenue_7days || []).map((d) => ({
    name: weekdayLabel(d.date),
    value: d.total,
  }))
  const chartData = revenueChartData.length
    ? revenueChartData
    : [
        { name: 'Today', value: overview.revenue.today },
        { name: 'Month', value: overview.revenue.month },
        { name: 'Year', value: overview.revenue.year },
        { name: 'Total', value: overview.revenue.total },
      ]

  const kpi = (
    icon: ReactNode,
    value: ReactNode,
    label: string,
  ) => (
    <div className="cd kp">
      <i>{icon}</i>
      <div>
        <b className="hf">{value}</b>
        <span>{label}</span>
      </div>
    </div>
  )

  return (
    <div className="space-y-4 page-enter st" style={{ maxWidth: 1440, margin: '0 auto' }}>
      {/* KPI grid */}
      <div className="g k">
        {kpi(<Wallet size={20} />, money(overview.revenue.total), 'Total Revenue')}
        {kpi(<TrendingUp size={20} />, money(overview.revenue.today), "Today's Revenue")}
        {kpi(<Wrench size={20} />, overview.repairs.active, 'Active Repairs')}
        {kpi(<Users size={20} />, overview.customers.total.toLocaleString(), 'Customers')}
        {kpi(<Package size={20} />, overview.low_stock_products.length, 'Low Stock')}
      </div>

      {/* charts */}
      <div className="g two">
        <div className="cd">
          <h3>Revenue, last 7 days</h3>
          <div style={{ height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0a2bff" stopOpacity={0.24} />
                    <stop offset="100%" stopColor="#0a6bff" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--bd)" />
                <XAxis dataKey="name" stroke="var(--mu)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--mu)" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip
                  formatter={(value: any) => [money(Number(value)), 'Revenue']}
                  contentStyle={{ borderRadius: 12, border: '1px solid var(--bd)', background: 'var(--sf)', color: 'var(--tx)' }}
                />
                <Area type="monotone" dataKey="value" stroke="#0a6bff" strokeWidth={3} fill="url(#revenueGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="cd">
          <h3>Repair Status</h3>
          <div className="tl">
            {repairsBreakdown.map((r) => (
              <div key={r.status}>
                <span style={{ flex: 1 }}>{r.label}</span>
                <div className="pr" style={{ flex: '0 0 55%', maxWidth: '55%' }}>
                  <i style={{ width: `${(r.count / repairsTotal) * 100}%` }} />
                </div>
                <b className="hf">{r.count}</b>
              </div>
            ))}
          </div>
          <p style={{ color: 'var(--mu)', fontSize: 12, marginTop: 12 }}>
            {overview.repairs.pending} pending • {overview.repairs.ready} ready
          </p>
        </div>
      </div>

      {/* recent repairs + low stock */}
      <div className="g two">
        <div className="cd">
          <div className="row" style={{ justifyContent: 'space-between', marginBottom: 8 }}>
            <h3 style={{ margin: 0 }}>Recent Repairs</h3>
            <Link to="/repairs" className="lk" style={{ fontSize: 13 }}>View all</Link>
          </div>
          {overview.recent_repairs.length === 0 ? (
            <div className="em">No repairs yet</div>
          ) : (
            <div className="sc">
              <table>
                <thead>
                  <tr>
                    <th>Ticket</th><th>Customer</th><th>Device</th><th>Status</th><th>Updated</th>
                  </tr>
                </thead>
                <tbody>
                  {overview.recent_repairs.slice(0, 6).map((row) => (
                    <tr key={row.id}>
                      <td><Link to={`/repairs/${row.id}`} className="lk">{row.ticket_number}</Link></td>
                      <td>{row.customer.first_name} {row.customer.last_name}</td>
                      <td>{row.device.brand} {row.device.model}</td>
                      <td>
                        <span className={`bd ${row.status === 'ready' || row.status === 'delivered' ? 'ok' : row.status.includes('diagnos') || row.status.includes('waiting') ? 'wa' : row.status === 'cancelled' ? 'er' : ''}`}>
                          {row.status_label}
                        </span>
                      </td>
                      <td>{new Date(row.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="cd">
          <div className="row" style={{ justifyContent: 'space-between', marginBottom: 8 }}>
            <h3 style={{ margin: 0 }}>Low-Stock Alerts</h3>
            <Link to="/inventory/low-stock" className="lk" style={{ fontSize: 13, color: 'var(--er)' }}>View all</Link>
          </div>
          {overview.low_stock_products.length === 0 ? (
            <div className="em">All products in stock</div>
          ) : (
            overview.low_stock_products.slice(0, 6).map((product: Product) => (
              <Link to={`/products/${product.id}`} className="ln" key={product.id} style={{ textDecoration: 'none' }}>
                <span style={{ minWidth: 0 }}>
                  <b style={{ display: 'block', fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{product.name}</b>
                  <small style={{ color: 'var(--mu)' }}>{product.sku}</small>
                </span>
                <span className="bd er">{product.stock_quantity} / {product.minimum_stock}</span>
              </Link>
            ))
          )}
        </div>
      </div>

      {/* quick actions */}
      <div className="cd">
        <h3>Quick Actions</h3>
        <div className="row">
          <Link to="/repairs/new" className="btn o"><Wrench size={16} /> New Repair</Link>
          <Link to="/sales/new" className="btn o"><ShoppingCart size={16} /> New Sale</Link>
          <Link to="/products/new" className="btn o"><Package size={16} /> Add Product</Link>
          <Link to="/customers/new" className="btn o"><Users size={16} /> Add Customer</Link>
        </div>
      </div>
    </div>
  )
}
