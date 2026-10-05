import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { auditApi } from '@/api'
import { Search } from 'lucide-react'

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
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Audit Logs</h1>
        <p className="text-sm text-muted">System activity log</p>
      </div>

      <div className="bg-surface rounded-lg border border-slate-200">
        <div className="p-4 border-b border-slate-200 flex flex-wrap items-center gap-3">
          <div className="relative max-w-md flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted" />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              placeholder="Search logs..."
              className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <select
            value={actionFilter}
            onChange={(e) => { setActionFilter(e.target.value); setPage(1) }}
            className="px-3 py-2 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20"
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
            className="px-3 py-2 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
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
                    <tr><td colSpan={6} className="px-4 py-8 text-center text-muted">No logs found.</td></tr>
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

            {data && data.count > 20 && (
              <div className="p-4 border-t border-slate-200 flex items-center justify-between">
                <p className="text-sm text-muted">Showing {(page - 1) * 20 + 1} to {Math.min(page * 20, data.count)} of {data.count}</p>
                <div className="flex gap-2">
                  <button disabled={!data.previous} onClick={() => setPage((p) => p - 1)} className="px-3 py-1.5 text-sm border border-slate-200 rounded-md disabled:opacity-50">Previous</button>
                  <button disabled={!data.next} onClick={() => setPage((p) => p + 1)} className="px-3 py-1.5 text-sm border border-slate-200 rounded-md disabled:opacity-50">Next</button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
