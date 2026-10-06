import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { devicesApi } from '@/api/devices.api'
import { Plus, Search, Edit2, Trash2, Eye, Laptop, Smartphone, Tablet, Monitor } from 'lucide-react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { Card, CardBody, Badge, Button, EmptyState } from '@/components/ui'
import type { Device } from '@/types'

const deviceIcon: Record<string, React.ReactNode> = {
  laptop: <Laptop className="h-6 w-6 text-slate-400" />,
  desktop: <Monitor className="h-6 w-6 text-slate-400" />,
  phone: <Smartphone className="h-6 w-6 text-slate-400" />,
  tablet: <Tablet className="h-6 w-6 text-slate-400" />,
  other: <Monitor className="h-6 w-6 text-slate-400" />,
}

export default function DevicesPage() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['devices', page, search],
    queryFn: () => devicesApi.list({ page, search, page_size: 20 }),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => devicesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['devices'] })
      toast.success('Device deleted')
      setDeleteId(null)
    },
    onError: () => toast.error('Failed to delete device'),
  })

  return (
    <div className="space-y-4 page-enter">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Devices</h1>
          <p className="text-sm text-muted">Customer devices</p>
        </div>
        <Link to="/devices/new">
          <Button icon={<Plus className="h-4 w-4" />}>Add Device</Button>
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
              placeholder="Search devices..."
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
                      <th className="text-left px-4 py-3 font-medium text-slate-600">Device</th>
                      <th className="text-left px-4 py-3 font-medium text-slate-600">Customer</th>
                      <th className="text-left px-4 py-3 font-medium text-slate-600">Brand</th>
                      <th className="text-left px-4 py-3 font-medium text-slate-600">Model</th>
                      <th className="text-left px-4 py-3 font-medium text-slate-600">Repairs</th>
                      <th className="text-left px-4 py-3 font-medium text-slate-600">Created</th>
                      <th className="text-right px-4 py-3 font-medium text-slate-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {data?.results?.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-4 py-8">
                          <EmptyState title="No devices found" description="Try adjusting your search." />
                        </td>
                      </tr>
                    ) : (
                      data?.results?.map((device: Device) => (
                        <tr key={device.id} className="hover:bg-slate-50">
                          <td className="px-4 py-3">
                            <Link to={`/devices/${device.id}`} className="font-medium text-slate-900 hover:text-primary">
                              {device.device_type_display}
                            </Link>
                          </td>
                          <td className="px-4 py-3 text-slate-600">{device.customer_name}</td>
                          <td className="px-4 py-3 text-slate-600">{device.brand}</td>
                          <td className="px-4 py-3 text-slate-600">{device.model}</td>
                          <td className="px-4 py-3 text-slate-600">{device.repair_count}</td>
                          <td className="px-4 py-3 text-slate-600">{new Date(device.created_at).toLocaleDateString()}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-end gap-1">
                              <Link to={`/devices/${device.id}`} className="p-2 hover:bg-slate-100 rounded-lg"><Eye className="h-4 w-4 text-slate-600" /></Link>
                              <Link to={`/devices/${device.id}/edit`} className="p-2 hover:bg-slate-100 rounded-lg"><Edit2 className="h-4 w-4 text-slate-600" /></Link>
                              <button onClick={() => setDeleteId(device.id)} className="p-2 hover:bg-danger/10 rounded-lg"><Trash2 className="h-4 w-4 text-danger" /></button>
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
                  <EmptyState title="No devices found" description="Try adjusting your search." />
                </CardBody>
              </Card>
            ) : (
              data?.results?.map((device: Device) => (
                <Card key={device.id} hover className="animate-slide-up">
                  <CardBody className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-center">
                          {deviceIcon[device.device_type] || deviceIcon.other}
                        </div>
                        <div className="min-w-0">
                          <Link to={`/devices/${device.id}`} className="text-sm font-semibold text-slate-900 hover:text-primary truncate block">
                            {device.device_type_display}
                          </Link>
                          <p className="text-xs text-muted">{device.customer_name}</p>
                        </div>
                      </div>
                      <Badge variant="info">{device.repair_count} repairs</Badge>
                    </div>

                    <div className="mt-3 flex items-center justify-between text-xs text-slate-600">
                      <span>{device.brand} {device.model}</span>
                      <span>{new Date(device.created_at).toLocaleDateString()}</span>
                    </div>

                    <div className="mt-3 flex items-center justify-end gap-1">
                      <Link to={`/devices/${device.id}`} className="p-2 hover:bg-slate-100 rounded-lg"><Eye className="h-4 w-4 text-slate-600" /></Link>
                      <Link to={`/devices/${device.id}/edit`} className="p-2 hover:bg-slate-100 rounded-lg"><Edit2 className="h-4 w-4 text-slate-600" /></Link>
                      <button onClick={() => setDeleteId(device.id)} className="p-2 hover:bg-danger/10 rounded-lg"><Trash2 className="h-4 w-4 text-danger" /></button>
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
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Delete Device</h3>
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
