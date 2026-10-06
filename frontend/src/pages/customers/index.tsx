import { useState, Fragment } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { customersApi } from '@/api/customers.api'
import { Plus, Search, Edit2, Trash2, Eye, Wrench, ShoppingCart } from 'lucide-react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { Card, CardBody, Badge, Button, EmptyState } from '@/components/ui'
import { useDebouncedValue } from '@/hooks/use-debounce'
import type { Customer } from '@/types'

export default function CustomersPage() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const queryClient = useQueryClient()
  const debouncedSearch = useDebouncedValue(search, 300)

  const { data, isLoading } = useQuery({
    queryKey: ['customers', page, debouncedSearch],
    queryFn: () => customersApi.list({ page, search: debouncedSearch, page_size: 20 }),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => customersApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] })
      toast.success('Customer deleted')
      setDeleteId(null)
    },
    onError: () => toast.error('Failed to delete customer'),
  })

  return (
    <div className="space-y-4 page-enter">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Customers</h1>
          <p className="text-sm text-muted">Manage your customers</p>
        </div>
        <Link to="/customers/new">
          <Button icon={<Plus className="h-4 w-4" />}>Add Customer</Button>
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
              placeholder="Search customers..."
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
        <Fragment>
          <div className="hidden md:block">
            <Card>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50">
                      <th className="text-left px-4 py-3 font-medium text-slate-600">Customer</th>
                      <th className="text-left px-4 py-3 font-medium text-slate-600">Phone</th>
                      <th className="text-left px-4 py-3 font-medium text-slate-600">Email</th>
                      <th className="text-left px-4 py-3 font-medium text-slate-600">Devices</th>
                      <th className="text-left px-4 py-3 font-medium text-slate-600">Repairs</th>
                      <th className="text-left px-4 py-3 font-medium text-slate-600">Total Spent</th>
                      <th className="text-left px-4 py-3 font-medium text-slate-600">Status</th>
                      <th className="text-right px-4 py-3 font-medium text-slate-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {data?.results?.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="px-4 py-8">
                          <EmptyState title="No customers found" description="Try adjusting your search or create a new customer." />
                        </td>
                      </tr>
                    ) : (
                      data?.results?.map((customer: Customer) => (
                        <tr key={customer.id} className="hover:bg-slate-50">
                          <td className="px-4 py-3">
                            <Link to={`/customers/${customer.id}`} className="font-medium text-slate-900 hover:text-primary">
                              {customer.first_name} {customer.last_name}
                            </Link>
                          </td>
                          <td className="px-4 py-3 text-slate-600">{customer.phone}</td>
                          <td className="px-4 py-3 text-slate-600">{customer.email || '-'}</td>
                          <td className="px-4 py-3 text-slate-600">{customer.device_count}</td>
                          <td className="px-4 py-3 text-slate-600">{customer.repair_count}</td>
                          <td className="px-4 py-3 text-slate-600">{customer.total_spent.toLocaleString()} TND</td>
                          <td className="px-4 py-3">
                            <Badge variant={customer.is_active ? 'success' : 'default'}>
                              {customer.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-end gap-1">
                              <Link to={`/customers/${customer.id}`} className="p-2 hover:bg-slate-100 rounded-lg"><Eye className="h-4 w-4 text-slate-600" /></Link>
                              <Link to={`/customers/${customer.id}/edit`} className="p-2 hover:bg-slate-100 rounded-lg"><Edit2 className="h-4 w-4 text-slate-600" /></Link>
                              <button onClick={() => setDeleteId(customer.id)} className="p-2 hover:bg-danger/10 rounded-lg"><Trash2 className="h-4 w-4 text-danger" /></button>
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
                  <EmptyState title="No customers found" description="Try adjusting your search or create a new customer." />
                </CardBody>
              </Card>
            ) : (
              data?.results?.map((customer: Customer) => (
                <Card key={customer.id} hover className="animate-slide-up">
                  <CardBody className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <Link to={`/customers/${customer.id}`} className="text-sm font-semibold text-slate-900 hover:text-primary truncate block">
                          {customer.first_name} {customer.last_name}
                        </Link>
                        <p className="text-xs text-muted mt-0.5">{customer.phone}</p>
                        <p className="text-xs text-muted">{customer.email || 'No email'}</p>
                      </div>
                      <Badge variant={customer.is_active ? 'success' : 'default'}>
                        {customer.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>

                    <div className="mt-3 flex items-center justify-between text-xs text-slate-600">
                      <span>{customer.company_name || 'Individual'}</span>
                      <span>{new Date(customer.created_at).toLocaleDateString()}</span>
                    </div>

                    <div className="mt-2 flex items-center gap-4 text-xs text-muted">
                      <span className="flex items-center gap-1"><Wrench className="h-3 w-3" /> {customer.repair_count} repairs</span>
                      <span className="flex items-center gap-1"><ShoppingCart className="h-3 w-3" /> {customer.total_spent.toLocaleString()} TND</span>
                    </div>

                    <div className="mt-3 flex items-center justify-end gap-1">
                      <Link to={`/customers/${customer.id}`} className="p-2 hover:bg-slate-100 rounded-lg"><Eye className="h-4 w-4 text-slate-600" /></Link>
                      <Link to={`/customers/${customer.id}/edit`} className="p-2 hover:bg-slate-100 rounded-lg"><Edit2 className="h-4 w-4 text-slate-600" /></Link>
                      <button onClick={() => setDeleteId(customer.id)} className="p-2 hover:bg-danger/10 rounded-lg"><Trash2 className="h-4 w-4 text-danger" /></button>
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
        </Fragment>
      )}

      {deleteId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-surface rounded-lg p-6 max-w-sm w-full mx-4">
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Delete Customer</h3>
            <p className="text-sm text-muted mb-4">Are you sure? This action cannot be undone.</p>
            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
              <Button variant="danger" onClick={() => deleteMutation.mutate(deleteId)} disabled={deleteMutation.isPending}>
                {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
