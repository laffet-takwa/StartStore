import { useQuery } from '@tanstack/react-query'
import { salesApi, invoicesApi } from '@/api'
import { ShoppingCart, FileText, ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Card, CardBody, Badge, EmptyState } from '@/components/ui'

export default function CustomerPortalOrders() {
  const { data: sales, isLoading: salesLoading } = useQuery({
    queryKey: ['customer-orders'],
    queryFn: () => salesApi.list({ page_size: 50 }),
  })

  const { data: invoices, isLoading: invoicesLoading } = useQuery({
    queryKey: ['customer-invoices'],
    queryFn: () => invoicesApi.list({ page_size: 50 }),
  })

  const orders = (sales as any)?.results || []
  const invoiceList = (invoices as any)?.results || []

  return (
    <div className="space-y-6 page-enter">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">My Orders</h1>
        <p className="text-sm text-muted">Track and manage your orders</p>
      </div>

      {salesLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-24 rounded-xl bg-slate-100 animate-pulse" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <Card>
          <CardBody>
            <EmptyState title="No orders yet" description="Your orders will appear here." />
          </CardBody>
        </Card>
      ) : (
        <div className="space-y-3">
          {orders.map((order: any) => (
            <Link key={order.id} to={`/track?order=${order.sale_number}`} className="block">
              <Card hover>
                <CardBody>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                        <ShoppingCart className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-900">{order.sale_number}</p>
                        <p className="text-xs text-muted">{new Date(order.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-sm font-semibold text-slate-900">{order.total?.toLocaleString()} TND</p>
                        <Badge variant={
                          order.payment_status === 'paid' ? 'success' :
                          order.payment_status === 'partial' ? 'warning' :
                          order.payment_status === 'refunded' ? 'danger' : 'default'
                        }>
                          {order.payment_status_label || order.payment_status}
                        </Badge>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted" />
                    </div>
                  </div>
                </CardBody>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {invoicesLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="h-20 rounded-xl bg-slate-100 animate-pulse" />
          ))}
        </div>
      ) : invoiceList.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Recent Invoices</h2>
          <div className="space-y-3">
            {invoiceList.slice(0, 5).map((invoice: any) => (
              <Card key={invoice.id} hover>
                <CardBody>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-info/10 text-info flex items-center justify-center">
                        <FileText className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-900">{invoice.invoice_number}</p>
                        <p className="text-xs text-muted">{new Date(invoice.issued_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-slate-900">{invoice.total?.toLocaleString()} TND</p>
                    </div>
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
