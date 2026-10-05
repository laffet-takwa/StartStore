import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { salesApi } from '@/api'
import { ArrowLeft, ShoppingCart, User, Calendar, CreditCard, FileText } from 'lucide-react'
import type { Sale, SaleItem } from '@/types'

export default function SaleDetailPage() {
  const { id } = useParams()
  const { data: sale, isLoading } = useQuery({
    queryKey: ['sale', id],
    queryFn: () => salesApi.get(id!),
    enabled: !!id,
  })

  if (isLoading || !sale) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const s = sale as Sale
  const items = s.items || []

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/sales" className="p-2 hover:bg-slate-100 rounded-md">
          <ArrowLeft className="h-5 w-5 text-slate-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{s.sale_number}</h1>
          <p className="text-sm text-muted">Sale Details</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-surface rounded-lg border border-slate-200 p-5">
            <h3 className="font-semibold text-slate-900 mb-4">Sale Information</h3>
            <div className="space-y-3">
              {s.customer_name && (
                <div className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4 text-muted" />
                  <span className="text-slate-600">{s.customer_name}</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted" />
                <span className="text-slate-600">{new Date(s.created_at).toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CreditCard className="h-4 w-4 text-muted" />
                <span className="text-slate-600">{s.payment_status_label}</span>
              </div>
            </div>
          </div>

          <div className="bg-surface rounded-lg border border-slate-200 p-5">
            <h3 className="font-semibold text-slate-900 mb-2">Totals</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm"><span className="text-muted">Subtotal</span><span className="text-slate-600">{s.subtotal.toLocaleString()} TND</span></div>
              <div className="flex justify-between text-sm"><span className="text-muted">Discount</span><span className="text-slate-600">{s.discount.toLocaleString()} TND</span></div>
              <div className="flex justify-between text-sm"><span className="text-muted">Tax</span><span className="text-slate-600">{s.tax.toLocaleString()} TND</span></div>
              <div className="flex justify-between text-sm font-semibold"><span className="text-slate-900">Total</span><span className="text-slate-900">{s.total.toLocaleString()} TND</span></div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="bg-surface rounded-lg border border-slate-200 p-5">
            <h3 className="font-semibold text-slate-900 mb-4">Items</h3>
            {items.length === 0 ? (
              <p className="text-sm text-muted">No items in this sale.</p>
            ) : (
              <div className="space-y-3">
                {items.map((item: SaleItem) => (
                  <div key={item.id} className="flex items-center justify-between p-3 rounded border border-slate-100">
                    <div>
                      <p className="text-sm font-medium text-slate-900">{item.product.name}</p>
                      <p className="text-xs text-muted">x{item.quantity} @ {item.unit_price.toLocaleString()} TND</p>
                    </div>
                    <span className="text-sm font-medium text-slate-900">{item.total_price.toLocaleString()} TND</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {s.notes && (
            <div className="bg-surface rounded-lg border border-slate-200 p-5">
              <h3 className="font-semibold text-slate-900 mb-2">Notes</h3>
              <p className="text-sm text-slate-600">{s.notes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
