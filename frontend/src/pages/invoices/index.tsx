import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { invoicesApi } from '@/api'
import { Search, Download, Eye } from 'lucide-react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { Card, CardBody, Button, EmptyState } from '@/components/ui'
import type { Invoice } from '@/types'

export default function InvoicesPage() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['invoices', page, search],
    queryFn: () => invoicesApi.list({ page, search, page_size: 20 }),
  })

  const downloadPdf = async (id: string) => {
    try {
      const blob = await invoicesApi.downloadPdf(id)
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `invoice-${id}.pdf`
      a.click()
      window.URL.revokeObjectURL(url)
    } catch {
      toast.error('Failed to download PDF')
    }
  }

  return (
    <div className="space-y-4 page-enter">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Invoices</h1>
        <p className="text-sm text-muted">Invoice history</p>
      </div>

      <Card>
        <CardBody className="p-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted" />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              placeholder="Search invoices..."
              className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </CardBody>
      </Card>

      {isLoading ? (
        <Card>
          <CardBody>
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-12 rounded-md bg-slate-100 animate-pulse" />
              ))}
            </div>
          </CardBody>
        </Card>
      ) : (
        <>
          <div className="hidden md:block">
            <Card>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50">
                      <th className="text-left px-4 py-3 font-medium text-slate-600">Invoice</th>
                      <th className="text-left px-4 py-3 font-medium text-slate-600">Customer</th>
                      <th className="text-left px-4 py-3 font-medium text-slate-600">Total</th>
                      <th className="text-left px-4 py-3 font-medium text-slate-600">Issued</th>
                      <th className="text-right px-4 py-3 font-medium text-slate-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {data?.results?.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-8">
                          <EmptyState title="No invoices found" description="Try adjusting your search." />
                        </td>
                      </tr>
                    ) : (
                      data?.results?.map((invoice: Invoice) => (
                        <tr key={invoice.id} className="hover:bg-slate-50">
                          <td className="px-4 py-3 font-medium text-slate-900">{invoice.invoice_number}</td>
                          <td className="px-4 py-3 text-slate-600">{invoice.customer?.first_name} {invoice.customer?.last_name}</td>
                          <td className="px-4 py-3 text-slate-600">{invoice.total.toLocaleString()} TND</td>
                          <td className="px-4 py-3 text-slate-600">{new Date(invoice.issued_at).toLocaleDateString()}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-end gap-1">
                              <Link to={`/invoices/${invoice.id}`} className="p-2 hover:bg-slate-100 rounded-lg"><Eye className="h-4 w-4 text-slate-600" /></Link>
                              <button onClick={() => downloadPdf(invoice.id)} className="p-2 hover:bg-slate-100 rounded-lg" title="Download PDF">
                                <Download className="h-4 w-4 text-slate-600" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>

          <div className="md:hidden space-y-3">
            {data?.results?.length === 0 ? (
              <Card>
                <CardBody>
                  <EmptyState title="No invoices found" description="Try adjusting your search." />
                </CardBody>
              </Card>
            ) : (
              data?.results?.map((invoice: Invoice) => (
                <Card key={invoice.id} hover className="animate-slide-up">
                  <CardBody className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <Link to={`/invoices/${invoice.id}`} className="text-sm font-semibold text-slate-900 hover:text-primary truncate block">
                          {invoice.invoice_number}
                        </Link>
                        <p className="text-xs text-muted mt-0.5">
                          {invoice.customer?.first_name} {invoice.customer?.last_name}
                        </p>
                      </div>
                      <span className="text-sm font-semibold text-slate-900">{invoice.total.toLocaleString()} TND</span>
                    </div>

                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-xs text-muted">{new Date(invoice.issued_at).toLocaleDateString()}</span>
                      <div className="flex gap-1">
                        <Link to={`/invoices/${invoice.id}`} className="p-2 hover:bg-slate-100 rounded-lg"><Eye className="h-4 w-4 text-slate-600" /></Link>
                        <button onClick={() => downloadPdf(invoice.id)} className="p-2 hover:bg-slate-100 rounded-lg" title="Download PDF">
                          <Download className="h-4 w-4 text-slate-600" />
                        </button>
                      </div>
                    </div>
                  </CardBody>
                </Card>
              ))
            )}
          </div>

          {data && data.count > 20 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted">Showing {(page - 1) * 20 + 1} to {Math.min(page * 20, data.count)} of {data.count}</p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={!data.previous} onClick={() => setPage((p) => p - 1)}>Previous</Button>
                <Button variant="outline" size="sm" disabled={!data.next} onClick={() => setPage((p) => p + 1)}>Next</Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
