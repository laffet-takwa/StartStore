import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { salesApi } from '@/api'
import { Plus, Search, Eye, ShoppingCart } from 'lucide-react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { Card, CardBody, Badge, Button, EmptyState } from '@/components/ui'
import type { Sale } from '@/types'

export default function SalesPage() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [cancelId, setCancelId] = useState<string | null>(null)
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['sales', page, search],
    queryFn: () => salesApi.list({ page, search, page_size: 20 }),
  })

  const cancelMutation = useMutation({
    mutationFn: (id: string) => salesApi.cancel(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] })
      toast.success('Sale cancelled')
      setCancelId(null)
    },
    onError: () => toast.error('Failed to cancel sale'),
  })

  return (
    <div className="space-y-4 page-enter">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Sales</h1>
          <p className="text-sm text-muted">Manage sales</p>
        </div>
        <Link to="/sales/new">
          <Button icon={<Plus className="h-4 w-4" />}>New Sale</Button>
        </Link>
      </div>

      <Card>
        <CardBody className="p-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted" />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              placeholder="Search sales..."
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
                      <th className="text-left px-4 py-3 font-medium text-slate-600">Sale</th>
                      <th className="text-left px-4 py-3 font-medium text-slate-600">Customer</th>
                      <th className="text-left px-4 py-3 font-medium text-slate-600">Total</th>
                      <th className="text-left px-4 py-3 font-medium text-slate-600">Status</th>
                      <th className="text-left px-4 py-3 font-medium text-slate-600">Payment</th>
                      <th className="text-left px-4 py-3 font-medium text-slate-600">Created</th>
                      <th className="text-right px-4 py-3 font-medium text-slate-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {data?.results?.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-4 py-8">
                          <EmptyState title="No sales found" description="Try adjusting your search or create a new sale." />
                        </td>
                      </tr>
                    ) : (
                      data?.results?.map((sale: Sale) => (
                        <tr key={sale.id} className="hover:bg-slate-50">
                          <td className="px-4 py-3">
                            <Link to={`/sales/${sale.id}`} className="font-medium text-slate-900 hover:text-primary">{sale.sale_number}</Link>
                          </td>
                          <td className="px-4 py-3 text-slate-600">{sale.customer_name || '-'}</td>
                          <td className="px-4 py-3 text-slate-600">{sale.total.toLocaleString()} TND</td>
                          <td className="px-4 py-3">
                            <Badge variant={sale.status === 'confirmed' ? 'success' : sale.status === 'cancelled' ? 'danger' : 'warning'}>
                              {sale.status_label}
                            </Badge>
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant={sale.payment_status === 'paid' ? 'success' : sale.payment_status === 'unpaid' ? 'danger' : 'warning'}>
                              {sale.payment_status_label}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-slate-600">{new Date(sale.created_at).toLocaleDateString()}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-end gap-1">
                              <Link to={`/sales/${sale.id}`} className="p-2 hover:bg-slate-100 rounded-lg"><Eye className="h-4 w-4 text-slate-600" /></Link>
                              {sale.status === 'draft' && (
                                <button onClick={() => setCancelId(sale.id)} className="p-2 hover:bg-danger/10 rounded-lg"><ShoppingCart className="h-4 w-4 text-danger" /></button>
                              )}
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
                  <EmptyState title="No sales found" description="Try adjusting your search or create a new sale." />
                </CardBody>
              </Card>
            ) : (
              data?.results?.map((sale: Sale) => (
                <Card key={sale.id} hover className="animate-slide-up">
                  <CardBody className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <Link to={`/sales/${sale.id}`} className="text-sm font-semibold text-slate-900 hover:text-primary truncate block">
                          {sale.sale_number}
                        </Link>
                        <p className="text-xs text-muted mt-0.5">{sale.customer_name || 'No customer'}</p>
                      </div>
                      <Badge variant={sale.status === 'confirmed' ? 'success' : sale.status === 'cancelled' ? 'danger' : 'warning'}>
                        {sale.status_label}
                      </Badge>
                    </div>

                    <div className="mt-3 flex items-center justify-between text-xs text-slate-600">
                      <span>{sale.total.toLocaleString()} TND</span>
                      <Badge variant={sale.payment_status === 'paid' ? 'success' : sale.payment_status === 'unpaid' ? 'danger' : 'warning'}>
                        {sale.payment_status_label}
                      </Badge>
                    </div>

                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-xs text-muted">{new Date(sale.created_at).toLocaleDateString()}</span>
                      <div className="flex gap-1">
                        <Link to={`/sales/${sale.id}`} className="p-2 hover:bg-slate-100 rounded-lg"><Eye className="h-4 w-4 text-slate-600" /></Link>
                        {sale.status === 'draft' && (
                          <button onClick={() => setCancelId(sale.id)} className="p-2 hover:bg-danger/10 rounded-lg"><ShoppingCart className="h-4 w-4 text-danger" /></button>
                        )}
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

      {cancelId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-surface rounded-lg p-6 max-w-sm w-full mx-4">
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Cancel Sale</h3>
            <p className="text-sm text-muted mb-4">Are you sure? This action cannot be undone.</p>
            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setCancelId(null)}>Cancel</Button>
              <Button variant="danger" onClick={() => cancelMutation.mutate(cancelId)} disabled={cancelMutation.isPending}>
                {cancelMutation.isPending ? 'Cancelling...' : 'Cancel Sale'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
