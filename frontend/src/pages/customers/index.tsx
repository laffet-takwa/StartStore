import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { customersApi } from '@/api/customers.api'
import { Plus, Search, Edit2, Trash2, Eye, Phone, Mail, MapPin } from 'lucide-react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import type { Customer } from '@/types'

export default function CustomersPage() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['customers', page, search],
    queryFn: () => customersApi.list({ page, search, page_size: 20 }),
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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Customers</h1>
          <p className="text-sm text-muted">Manage your customers</p>
        </div>
        <Link
          to="/customers/new"
          className="inline-flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" /> Add Customer
        </Link>
      </div>

      <div className="bg-surface rounded-lg border border-slate-200">
        <div className="p-4 border-b border-slate-200">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted" />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              placeholder="Search customers..."
              className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="p-8 flex justify-center">
            <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="text-left px-4 py-3 font-medium text-slate-600">Customer</th>
                    <th className="text-left px-4 py-3 font-medium text-slate-600">Phone</th>
                    <th className="text-left px-4 py-3 font-medium text-slate-600">Email</th>
                    <th className="text-left px-4 py-3 font-medium text-slate-600">Company</th>
                    <th className="text-left px-4 py-3 font-medium text-slate-600">Devices</th>
                    <th className="text-left px-4 py-3 font-medium text-slate-600">Repairs</th>
                    <th className="text-left px-4 py-3 font-medium text-slate-600">Status</th>
                    <th className="text-left px-4 py-3 font-medium text-slate-600">Created</th>
                    <th className="text-right px-4 py-3 font-medium text-slate-600">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data?.results?.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-4 py-8 text-center text-muted">
                        No customers found.
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
                        <td className="px-4 py-3 text-slate-600">{customer.company_name || '-'}</td>
                        <td className="px-4 py-3 text-slate-600">{customer.device_count}</td>
                        <td className="px-4 py-3 text-slate-600">{customer.repair_count}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${customer.is_active ? 'bg-success/10 text-success' : 'bg-slate-100 text-slate-600'}`}>
                            {customer.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          {new Date(customer.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <Link to={`/customers/${customer.id}`} className="p-1.5 hover:bg-slate-100 rounded">
                              <Eye className="h-4 w-4 text-slate-600" />
                            </Link>
                            <Link to={`/customers/${customer.id}/edit`} className="p-1.5 hover:bg-slate-100 rounded">
                              <Edit2 className="h-4 w-4 text-slate-600" />
                            </Link>
                            <button onClick={() => setDeleteId(customer.id)} className="p-1.5 hover:bg-danger/10 rounded">
                              <Trash2 className="h-4 w-4 text-danger" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {data && data.count > 20 && (
              <div className="p-4 border-t border-slate-200 flex items-center justify-between">
                <p className="text-sm text-muted">
                  Showing {(page - 1) * 20 + 1} to {Math.min(page * 20, data.count)} of {data.count}
                </p>
                <div className="flex gap-2">
                  <button
                    disabled={!data.previous}
                    onClick={() => setPage((p) => p - 1)}
                    className="px-3 py-1.5 text-sm border border-slate-200 rounded-md disabled:opacity-50 hover:bg-slate-50"
                  >
                    Previous
                  </button>
                  <button
                    disabled={!data.next}
                    onClick={() => setPage((p) => p + 1)}
                    className="px-3 py-1.5 text-sm border border-slate-200 rounded-md disabled:opacity-50 hover:bg-slate-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {deleteId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-surface rounded-lg p-6 max-w-sm w-full mx-4">
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Delete Customer</h3>
            <p className="text-sm text-muted mb-4">
              Are you sure? This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setDeleteId(null)} className="px-4 py-2 text-sm border border-slate-200 rounded-md hover:bg-slate-50">
                Cancel
              </button>
              <button
                onClick={() => deleteMutation.mutate(deleteId)}
                disabled={deleteMutation.isPending}
                className="px-4 py-2 text-sm bg-danger text-white rounded-md hover:bg-danger/90 disabled:opacity-50"
              >
                {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}