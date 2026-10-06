import { useQuery } from '@tanstack/react-query'
import { invoicesApi } from '@/api'
import { FileText, Download } from 'lucide-react'
import { Card, CardBody, Button, EmptyState } from '@/components/ui'

export default function CustomerPortalInvoices() {
  const { data, isLoading } = useQuery({
    queryKey: ['customer-invoices-portal'],
    queryFn: () => invoicesApi.list({ page_size: 50 }),
  })

  const invoices = (data as any)?.results || []

  return (
    <div className="space-y-6 page-enter">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">My Invoices</h1>
        <p className="text-sm text-muted">View and download your invoices</p>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-24 rounded-xl bg-slate-100 animate-pulse" />
          ))}
        </div>
      ) : invoices.length === 0 ? (
        <Card>
          <CardBody>
            <EmptyState title="No invoices yet" description="Your invoices will appear here." />
          </CardBody>
        </Card>
      ) : (
        <div className="space-y-3">
          {invoices.map((invoice: any) => (
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
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-sm font-semibold text-slate-900">{invoice.total?.toLocaleString()} TND</p>
                      <p className="text-xs text-muted">{invoice.customer?.first_name} {invoice.customer?.last_name}</p>
                    </div>
                    <Button variant="ghost" size="sm" icon={<Download className="h-4 w-4" />}>
                      PDF
                    </Button>
                  </div>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
