import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { suppliersApi } from '@/api'
import { ArrowLeft, Phone, Mail, MapPin, Building2, Package } from 'lucide-react'
import type { Supplier } from '@/types'

export default function SupplierDetailPage() {
  const { id } = useParams()
  const { data: supplier, isLoading } = useQuery({
    queryKey: ['supplier', id],
    queryFn: () => suppliersApi.get(id!),
    enabled: !!id,
  })

  if (isLoading || !supplier) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const s = supplier as Supplier

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/suppliers" className="p-2 hover:bg-slate-100 rounded-md">
          <ArrowLeft className="h-5 w-5 text-slate-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{s.name}</h1>
          <p className="text-sm text-muted">Supplier Details</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-surface rounded-lg border border-slate-200 p-5">
            <h3 className="font-semibold text-slate-900 mb-4">Contact Information</h3>
            <div className="space-y-3">
              {s.contact_person && (
                <div className="flex items-center gap-2 text-sm">
                  <Building2 className="h-4 w-4 text-muted" />
                  <span className="text-slate-600">{s.contact_person}</span>
                </div>
              )}
              {s.phone && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-muted" />
                  <span className="text-slate-600">{s.phone}</span>
                </div>
              )}
              {s.email && (
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted" />
                  <span className="text-slate-600">{s.email}</span>
                </div>
              )}
              {s.address && (
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-muted" />
                  <span className="text-slate-600">{s.address}</span>
                </div>
              )}
            </div>
          </div>

          <div className="bg-surface rounded-lg border border-slate-200 p-5">
            <h3 className="font-semibold text-slate-900 mb-2">Statistics</h3>
            <div className="p-3 bg-slate-50 rounded-md">
              <p className="text-xs text-muted">Products</p>
              <p className="text-lg font-semibold">{s.product_count}</p>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="bg-surface rounded-lg border border-slate-200 p-5">
            <h3 className="font-semibold text-slate-900 mb-2">Notes</h3>
            <p className="text-sm text-slate-600">{s.notes || 'No notes.'}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
