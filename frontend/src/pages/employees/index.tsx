import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { employeesApi } from '@/api'
import { Search, Trash2, UserCog } from 'lucide-react'
import { toast } from 'sonner'
import { Card, CardBody, Badge, Button, EmptyState } from '@/components/ui'
import type { Employee } from '@/types'

export default function EmployeesPage() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['employees', page, search],
    queryFn: () => employeesApi.list({ page, search, page_size: 20 }),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => employeesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] })
      toast.success('Employee deleted')
      setDeleteId(null)
    },
    onError: () => toast.error('Failed to delete employee'),
  })

  return (
    <div className="space-y-4 page-enter">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Employees</h1>
          <p className="text-sm text-muted">Manage employees</p>
        </div>
      </div>

      <Card>
        <CardBody className="p-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted" />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              placeholder="Search employees..."
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
                      <th className="text-left px-4 py-3 font-medium text-slate-600">Employee</th>
                      <th className="text-left px-4 py-3 font-medium text-slate-600">Email</th>
                      <th className="text-left px-4 py-3 font-medium text-slate-600">Role</th>
                      <th className="text-left px-4 py-3 font-medium text-slate-600">Status</th>
                      <th className="text-left px-4 py-3 font-medium text-slate-600">Joined</th>
                      <th className="text-right px-4 py-3 font-medium text-slate-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {data?.results?.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-8">
                          <EmptyState title="No employees found" description="Try adjusting your search." />
                        </td>
                      </tr>
                    ) : (
                      data?.results?.map((emp: Employee) => (
                        <tr key={emp.id} className="hover:bg-slate-50">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                                <UserCog className="h-4 w-4 text-primary" />
                              </div>
                              <span className="font-medium text-slate-900">{emp.full_name}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-slate-600">{emp.email}</td>
                          <td className="px-4 py-3 text-slate-600">
                            <Badge variant="info">{emp.role_display}</Badge>
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant={emp.is_active ? 'success' : 'default'}>
                              {emp.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-slate-600">{new Date(emp.date_joined).toLocaleDateString()}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-end gap-1">
                              <button onClick={() => setDeleteId(emp.id)} className="p-2 hover:bg-danger/10 rounded-lg"><Trash2 className="h-4 w-4 text-danger" /></button>
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
                  <EmptyState title="No employees found" description="Try adjusting your search." />
                </CardBody>
              </Card>
            ) : (
              data?.results?.map((emp: Employee) => (
                <Card key={emp.id} hover className="animate-slide-up">
                  <CardBody className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <UserCog className="h-5 w-5 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-900 truncate">{emp.full_name}</p>
                          <p className="text-xs text-muted">{emp.email}</p>
                        </div>
                      </div>
                      <Badge variant={emp.is_active ? 'success' : 'default'}>
                        {emp.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>

                    <div className="mt-3 flex items-center justify-between text-xs text-slate-600">
                      <Badge variant="info">{emp.role_display}</Badge>
                      <span>{new Date(emp.date_joined).toLocaleDateString()}</span>
                    </div>

                    <div className="mt-3 flex items-center justify-end gap-1">
                      <button onClick={() => setDeleteId(emp.id)} className="p-2 hover:bg-danger/10 rounded-lg"><Trash2 className="h-4 w-4 text-danger" /></button>
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

      {deleteId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-surface rounded-lg p-6 max-w-sm w-full mx-4">
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Delete Employee</h3>
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
