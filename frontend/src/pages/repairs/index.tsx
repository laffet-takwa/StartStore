import { useState, Fragment } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { repairsApi } from '@/api'
import { Plus, Search, Edit2, Trash2, Eye, Filter } from 'lucide-react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { Card, CardBody, Badge, Button, EmptyState } from '@/components/ui'
import { useDebouncedValue } from '@/hooks/use-debounce'
import type { RepairTicket } from '@/types'

const STATUS_TABS = [
  { value: '', label: 'All', icon: null },
  { value: 'received', label: 'Received', icon: null },
  { value: 'diagnosis', label: 'Diagnosis', icon: null },
  { value: 'waiting_customer', label: 'Waiting', icon: null },
  { value: 'repairing', label: 'Repairing', icon: null },
  { value: 'testing', label: 'Testing', icon: null },
  { value: 'ready', label: 'Ready', icon: null },
  { value: 'delivered', label: 'Delivered', icon: null },
  { value: 'cancelled', label: 'Cancelled', icon: null },
]

export default function RepairsPage() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const queryClient = useQueryClient()
  const debouncedSearch = useDebouncedValue(search, 300)

  const { data, isLoading } = useQuery({
    queryKey: ['repairs', page, debouncedSearch, statusFilter],
    queryFn: () => repairsApi.list({ page, search: debouncedSearch, status: statusFilter, page_size: 20 }),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => repairsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['repairs'] })
      toast.success('Repair deleted')
      setDeleteId(null)
    },
    onError: () => toast.error('Failed to delete repair'),
  })

  return (
    <div className="space-y-4 page-enter">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Repairs</h1>
          <p className="text-sm text-muted">Manage repair tickets and technician workflow</p>
        </div>
        <Link to="/repairs/new">
          <Button icon={<Plus className="h-4 w-4" />}>New Repair</Button>
        </Link>
      </div>

      <Card>
        <CardBody className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted" />
              <input
                type="text"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1) }}
                placeholder="Search repairs..."
                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted" />
              <select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
                className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="">All Statuses</option>
                <option value="received">Received</option>
                <option value="diagnosis">Diagnosis</option>
                <option value="waiting_customer">Waiting Customer</option>
                <option value="approved">Approved</option>
                <option value="repairing">Repairing</option>
                <option value="testing">Testing</option>
                <option value="ready">Ready</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
        </CardBody>
      </Card>

      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => { setStatusFilter(tab.value); setPage(1) }}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              statusFilter === tab.value
                ? 'bg-primary text-white shadow-sm'
                : 'bg-surface border border-slate-200 text-muted hover:text-base hover:border-primary/20'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

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
                      <th className="text-left px-4 py-3 font-medium text-slate-600">Ticket</th>
                      <th className="text-left px-4 py-3 font-medium text-slate-600">Customer</th>
                      <th className="text-left px-4 py-3 font-medium text-slate-600">Device</th>
                      <th className="text-left px-4 py-3 font-medium text-slate-600">Status</th>
                      <th className="text-left px-4 py-3 font-medium text-slate-600">Cost</th>
                      <th className="text-left px-4 py-3 font-medium text-slate-600">Received</th>
                      <th className="text-right px-4 py-3 font-medium text-slate-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {data?.results?.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-4 py-8">
                          <EmptyState title="No repairs found" description="Try adjusting your search or filters." />
                        </td>
                      </tr>
                    ) : (
                      data?.results?.map((repair: RepairTicket) => (
                        <tr key={repair.id} className="hover:bg-slate-50">
                          <td className="px-4 py-3">
                            <Link to={`/repairs/${repair.id}`} className="font-medium text-slate-900 hover:text-primary">{repair.ticket_number}</Link>
                          </td>
                          <td className="px-4 py-3 text-slate-600">{repair.customer?.first_name} {repair.customer?.last_name}</td>
                          <td className="px-4 py-3 text-slate-600">{repair.device?.brand} {repair.device?.model}</td>
                          <td className="px-4 py-3">
                            <Badge variant={statusVariant(repair.status)}>{repair.status_label || repair.status}</Badge>
                          </td>
                          <td className="px-4 py-3 text-slate-600">{repair.final_cost?.toLocaleString() ?? repair.estimated_cost.toLocaleString()} TND</td>
                          <td className="px-4 py-3 text-slate-600">{new Date(repair.received_at).toLocaleDateString()}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-end gap-1">
                              <Link to={`/repairs/${repair.id}`} className="p-2 hover:bg-slate-100 rounded-lg"><Eye className="h-4 w-4 text-slate-600" /></Link>
                              <Link to={`/repairs/${repair.id}/edit`} className="p-2 hover:bg-slate-100 rounded-lg"><Edit2 className="h-4 w-4 text-slate-600" /></Link>
                              <button onClick={() => setDeleteId(repair.id)} className="p-2 hover:bg-danger/10 rounded-lg"><Trash2 className="h-4 w-4 text-danger" /></button>
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
                  <EmptyState title="No repairs found" description="Try adjusting your search or filters." />
                </CardBody>
              </Card>
            ) : (
              data?.results?.map((repair: RepairTicket) => (
                <Card key={repair.id} hover className="animate-slide-up">
                  <CardBody className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <Link to={`/repairs/${repair.id}`} className="text-sm font-semibold text-slate-900 hover:text-primary truncate block">
                          {repair.ticket_number}
                        </Link>
                        <p className="text-xs text-muted mt-0.5">
                          {repair.customer?.first_name} {repair.customer?.last_name}
                        </p>
                      </div>
                      <Badge variant={statusVariant(repair.status)}>{repair.status_label || repair.status}</Badge>
                    </div>

                    <div className="mt-3 flex items-center justify-between text-xs text-slate-600">
                      <span>{repair.device?.brand} {repair.device?.model}</span>
                      <span>{repair.final_cost?.toLocaleString() ?? repair.estimated_cost.toLocaleString()} TND</span>
                    </div>

                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-xs text-muted">{new Date(repair.received_at).toLocaleDateString()}</span>
                      <div className="flex gap-1">
                        <Link to={`/repairs/${repair.id}`} className="p-2 hover:bg-slate-100 rounded-lg"><Eye className="h-4 w-4 text-slate-600" /></Link>
                        <Link to={`/repairs/${repair.id}/edit`} className="p-2 hover:bg-slate-100 rounded-lg"><Edit2 className="h-4 w-4 text-slate-600" /></Link>
                        <button onClick={() => setDeleteId(repair.id)} className="p-2 hover:bg-danger/10 rounded-lg"><Trash2 className="h-4 w-4 text-danger" /></button>
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
        </Fragment>
      )}

      {deleteId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-surface rounded-lg p-6 max-w-sm w-full mx-4">
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Delete Repair</h3>
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

function statusVariant(status: string): 'default' | 'success' | 'warning' | 'danger' | 'info' {
  const map: Record<string, 'default' | 'success' | 'warning' | 'danger' | 'info'> = {
    received: 'default',
    diagnosis: 'info',
    waiting_customer: 'warning',
    approved: 'default',
    repairing: 'warning',
    testing: 'info',
    ready: 'success',
    delivered: 'success',
    cancelled: 'danger',
  }
  return map[status] || 'default'
}
