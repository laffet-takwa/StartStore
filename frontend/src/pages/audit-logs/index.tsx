import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { auditApi } from '@/api'
import { Search } from 'lucide-react'
import { Card, CardBody, Badge, Button, EmptyState } from '@/components/ui'

export default function AuditLogsPage() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [actionFilter, setActionFilter] = useState('')
  const [entityFilter, setEntityFilter] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['audit-logs', page, search, actionFilter, entityFilter],
    queryFn: () => auditApi.list({ page, search, action: actionFilter, entity_type: entityFilter, page_size: 20 }),
  })

  return (
    <div className="space-y-4 page-enter">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Audit Logs</h1>
        <p className="text-sm text-muted">System activity log</p>
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
                placeholder="Search logs..."
                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <select
              value={actionFilter}
              onChange={(e) => { setActionFilter(e.target.value); setPage(1) }}
              className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="">All Actions</option>
              <option value="create">Create</option>
              <option value="update">Update</option>
              <option value="delete">Delete</option>
            </select>
            <input
              type="text"
              value={entityFilter}
              onChange={(e) => { setEntityFilter(e.target.value); setPage(1) }}
              placeholder="Entity type..."
              className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
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
                      <th className="text-left px-4 py-3 font-medium text-slate-600">Action</th>
                      <th className="text-left px-4 py-3 font-medium text-slate-600">Entity</th>
                      <th className="text-left px-4 py-3 font-medium text-slate-600">Entity ID</th>
                      <th className="text-left px-4 py-3 font-medium text-slate-600">User</th>
                      <th className="text-left px-4 py-3 font-medium text-slate-600">IP</th>
                      <th className="text-left px-4 py-3 font-medium text-slate-600">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {data?.results?.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-8">
                          <EmptyState title="No logs found" description="Try adjusting your search or filters." />
                        </td>
                      </tr>
                    ) : (
                      data?.results?.map((log: any) => (
                        <tr key={log.id} className="hover:bg-slate-50">
                          <td className="px-4 py-3 text-slate-600">{log.action_label}</td>
                          <td className="px-4 py-3 text-slate-600">{log.entity_type}</td>
                          <td className="px-4 py-3 text-slate-600">{log.entity_id || '-'}</td>
                          <td className="px-4 py-3 text-slate-600">{log.employee_name || '-'}</td>
                          <td className="px-4 py-3 text-slate-600">{log.ip_address || '-'}</td>
                          <td className="px-4 py-3 text-slate-600">{new Date(log.created_at).toLocaleString()}</td>
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
                  <EmptyState title="No logs found" description="Try adjusting your search or filters." />
                </CardBody>
              </Card>
            ) : (
              data?.results?.map((log: any) => (
                <Card key={log.id} hover className="animate-slide-up">
                  <CardBody className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-900">{log.action_label}</p>
                        <p className="text-xs text-muted mt-0.5">{log.entity_type} {log.entity_id || ''}</p>
                      </div>
                      <Badge variant="info">{new Date(log.created_at).toLocaleDateString()}</Badge>
                    </div>
                    <div className="mt-2 text-xs text-slate-600">
                      User: {log.employee_name || '-'} · IP: {log.ip_address || '-'}
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
