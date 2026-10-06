import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { invoicesApi } from '@/api'
import { ArrowLeft, User, Calendar } from 'lucide-react'
import { Card, CardBody } from '@/components/ui'
import type { Invoice } from '@/types'

export default function InvoiceDetailPage() {
  const { id } = useParams()
  const { data: invoice, isLoading } = useQuery({
    queryKey: ['invoice', id],
    queryFn: () => invoicesApi.get(id!),
    enabled: !!id,
  })

  if (isLoading || !invoice) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const inv = invoice as Invoice

  return (
    <div className="space-y-6 page-enter">
      <div className="flex items-center gap-4">
        <Link to="/invoices" className="p-2 hover:bg-slate-100 rounded-md">
          <ArrowLeft className="h-5 w-5 text-slate-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{inv.invoice_number}</h1>
          <p className="text-sm text-muted">Invoice Details</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardBody>
              <h3 className="text-sm font-semibold text-slate-900 mb-4">Customer</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4 text-muted" />
                  <span className="text-slate-600">{inv.customer.first_name} {inv.customer.last_name}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted" />
                  <span className="text-slate-600">Issued {new Date(inv.issued_at).toLocaleDateString()}</span>
                </div>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <h3 className="text-sm font-semibold text-slate-900 mb-2">Totals</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm"><span className="text-muted">Subtotal</span><span className="text-slate-600">{inv.subtotal.toLocaleString()} TND</span></div>
                <div className="flex justify-between text-sm"><span className="text-muted">Discount</span><span className="text-slate-600">{inv.discount.toLocaleString()} TND</span></div>
                <div className="flex justify-between text-sm"><span className="text-muted">Tax</span><span className="text-slate-600">{inv.tax.toLocaleString()} TND</span></div>
                <div className="flex justify-between text-sm font-semibold"><span className="text-slate-900">Total</span><span className="text-slate-900">{inv.total.toLocaleString()} TND</span></div>
              </div>
            </CardBody>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Card>
            <CardBody>
              <h3 className="text-sm font-semibold text-slate-900 mb-2">Notes</h3>
              <p className="text-sm text-slate-600">{inv.notes || 'No notes.'}</p>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  )
}
