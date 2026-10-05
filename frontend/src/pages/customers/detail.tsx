import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { customersApi } from '@/api/customers.api'
import { ArrowLeft, Phone, Mail, MapPin, Building2, Calendar } from 'lucide-react'
import type { Customer } from '@/types'

export default function CustomerDetailPage() {
  const { id } = useParams()
  const { data: customer, isLoading } = useQuery({
    queryKey: ['customer', id],
    queryFn: () => customersApi.get(id!),
    enabled: !!id,
  })

  if (isLoading || !customer) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const c = customer as Customer

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/customers" className="p-2 hover:bg-slate-100 rounded-md">
          <ArrowLeft className="h-5 w-5 text-slate-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {c.first_name} {c.last_name}
          </h1>
          <p className="text-sm text-muted">Customer Details</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-surface rounded-lg border border-slate-200 p-5">
            <h3 className="font-semibold text-slate-900 mb-4">Contact Information</h3>
            <div className="space-y-3">
              {c.phone && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-muted" />
                  <span className="text-slate-600">{c.phone}</span>
                </div>
              )}
              {c.email && (
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted" />
                  <span className="text-slate-600">{c.email}</span>
                </div>
              )}
              {c.address && (
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-muted" />
                  <span className="text-slate-600">{c.address}</span>
                </div>
              )}
              {c.company_name && (
                <div className="flex items-center gap-2 text-sm">
                  <Building2 className="h-4 w-4 text-muted" />
                  <span className="text-slate-600">{c.company_name}</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted" />
                <span className="text-slate-600">Since {new Date(c.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          <div className="bg-surface rounded-lg border border-slate-200 p-5">
            <h3 className="font-semibold text-slate-900 mb-3">Statistics</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-slate-50 rounded-md">
                <p className="text-xs text-muted">Devices</p>
                <p className="text-lg font-semibold">{c.device_count}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-md">
                <p className="text-xs text-muted">Repairs</p>
                <p className="text-lg font-semibold">{c.repair_count}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-md col-span-2">
                <p className="text-xs text-muted">Total Spent</p>
                <p className="text-lg font-semibold">{c.total_spent?.toLocaleString() ?? 0} TND</p>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="bg-surface rounded-lg border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-900">Devices</h3>
              <Link to={`/customers/${c.id}/devices`} className="text-sm text-primary hover:underline">View all</Link>
            </div>
            {/* Device list placeholder - integrate devicesApi.list({ customer: c.id }) */}
          </div>

          <div className="bg-surface rounded-lg border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-900">Recent Repairs</h3>
            </div>
            {/* Repairs list placeholder */}
          </div>

          <div className="bg-surface rounded-lg border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-900">Sales</h3>
            </div>
            {/* Sales list placeholder */}
          </div>

          <div className="bg-surface rounded-lg border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-900">Payments</h3>
            </div>
            {/* Payments list placeholder */}
          </div>
        </div>
      </div>
    </div>
  )
}