import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { repairsApi } from '@/api'
import { ArrowLeft, Clock, Wrench, User, Printer, Download } from 'lucide-react'
import { toast } from 'sonner'
import { Card, CardBody, Badge, Button, Tabs } from '@/components/ui'
import type { RepairTicket } from '@/types'

const REPAIR_STATUS_FLOW: Record<string, string[]> = {
  received: ['diagnosis'],
  diagnosis: ['waiting_customer', 'approved', 'repairing'],
  waiting_customer: ['approved', 'cancelled'],
  approved: ['repairing'],
  repairing: ['testing'],
  testing: ['ready'],
  ready: ['delivered'],
  delivered: [],
  cancelled: [],
}

export default function RepairDetailPage() {
  const { id } = useParams()
  const queryClient = useQueryClient()
  const { data: repair, isLoading } = useQuery({
    queryKey: ['repair', id],
    queryFn: () => repairsApi.get(id!),
    enabled: !!id,
  })

  const transitionMutation = useMutation({
    mutationFn: ({ status, note }: { status: string; note?: string }) =>
      repairsApi.updateStatus(id!, status, note),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['repair', id] })
      queryClient.invalidateQueries({ queryKey: ['repairs'] })
      toast.success('Status updated')
    },
    onError: () => toast.error('Failed to update status'),
  })

  if (isLoading || !repair) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const r = repair as RepairTicket
  const availableTransitions = REPAIR_STATUS_FLOW[r.status] || []

  const statusSteps: Array<{
    key: string
    label: string
    description?: string
    status: 'completed' | 'current' | 'pending' | 'cancelled'
    timestamp?: string
  }> = [
    { key: 'received', label: 'Received', description: 'Repair ticket created', status: 'completed', timestamp: new Date(r.received_at).toLocaleString() },
    { key: 'diagnosis', label: 'Diagnosis', description: r.diagnosis || 'Awaiting diagnosis', status: ['diagnosis', 'waiting_customer', 'approved', 'repairing', 'testing', 'ready', 'delivered'].includes(r.status) ? 'completed' : r.status === 'diagnosis' ? 'current' : 'pending', timestamp: r.diagnosed_at ? new Date(r.diagnosed_at).toLocaleString() : undefined },
    { key: 'waiting_customer', label: 'Waiting for Customer', description: 'Awaiting customer approval', status: ['approved', 'repairing', 'testing', 'ready', 'delivered'].includes(r.status) ? 'completed' : r.status === 'waiting_customer' ? 'current' : 'pending', timestamp: undefined },
    { key: 'approved', label: 'Approved', description: 'Customer approved the repair', status: ['repairing', 'testing', 'ready', 'delivered'].includes(r.status) ? 'completed' : r.status === 'approved' ? 'current' : 'pending', timestamp: r.approved_at ? new Date(r.approved_at).toLocaleString() : undefined },
    { key: 'repairing', label: 'Repairing', description: 'Technician is working on the repair', status: ['testing', 'ready', 'delivered'].includes(r.status) ? 'completed' : r.status === 'repairing' ? 'current' : 'pending', timestamp: r.started_at ? new Date(r.started_at).toLocaleString() : undefined },
    { key: 'testing', label: 'Testing', description: 'Quality assurance testing', status: ['ready', 'delivered'].includes(r.status) ? 'completed' : r.status === 'testing' ? 'current' : 'pending', timestamp: r.tested_at ? new Date(r.tested_at).toLocaleString() : undefined },
    { key: 'ready', label: 'Ready for Pickup', description: 'Repair completed and ready', status: r.status === 'delivered' ? 'completed' : r.status === 'ready' ? 'current' : 'pending', timestamp: r.ready_at ? new Date(r.ready_at).toLocaleString() : undefined },
    { key: 'delivered', label: 'Delivered', description: 'Device returned to customer', status: r.status === 'delivered' ? 'completed' : 'pending', timestamp: r.delivered_at ? new Date(r.delivered_at).toLocaleString() : undefined },
  ]

  if (r.status === 'cancelled') {
    statusSteps.push({ key: 'cancelled', label: 'Cancelled', description: 'Repair was cancelled', status: 'cancelled', timestamp: r.cancelled_at ? new Date(r.cancelled_at).toLocaleString() : undefined })
  }

  return (
    <div className="space-y-6 page-enter">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link to="/repairs" className="p-2 hover:bg-slate-100 rounded-md">
            <ArrowLeft className="h-5 w-5 text-slate-600" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{r.ticket_number}</h1>
            <p className="text-sm text-muted">Repair Details</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" icon={<Printer className="h-4 w-4" />}>Print</Button>
          <Button variant="outline" size="sm" icon={<Download className="h-4 w-4" />}>Export</Button>
        </div>
      </div>

      {availableTransitions.length > 0 && (
        <Card>
          <CardBody>
            <h3 className="font-semibold text-slate-900 mb-3">Update Status</h3>
            <div className="flex flex-wrap gap-2">
              {availableTransitions.map((status) => (
                <Button
                  key={status}
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const note = prompt('Add a note (optional):')
                    transitionMutation.mutate({ status, note: note || undefined })
                  }}
                >
                  {status.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                </Button>
              ))}
            </div>
          </CardBody>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardBody>
              <h3 className="font-semibold text-slate-900 mb-4">Customer & Device</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4 text-muted" />
                  <span className="text-slate-600">{r.customer.first_name} {r.customer.last_name}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Wrench className="h-4 w-4 text-muted" />
                  <span className="text-slate-600">{r.device.brand} {r.device.model}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-muted" />
                  <span className="text-slate-600">Received {new Date(r.received_at).toLocaleString()}</span>
                </div>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <h3 className="font-semibold text-slate-900 mb-2">Current Status</h3>
              <Badge variant={r.status === 'delivered' ? 'success' : r.status === 'cancelled' ? 'danger' : 'info'} size="md">
                {r.status_label}
              </Badge>
            </CardBody>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Card>
            <CardBody>
              <Tabs
                tabs={[
                  { id: 'details', label: 'Details' },
                  { id: 'parts', label: 'Parts' },
                  { id: 'images', label: 'Images' },
                  { id: 'timeline', label: 'Timeline' },
                ]}
                activeTab="details"
                onChange={() => {}}
              />
              <div className="mt-4">
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-slate-900 mb-1">Problem Description</h4>
                    <p className="text-sm text-slate-600">{r.problem_description}</p>
                  </div>
                  {r.diagnosis && (
                    <div>
                      <h4 className="text-sm font-medium text-slate-900 mb-1">Diagnosis</h4>
                      <p className="text-sm text-slate-600">{r.diagnosis}</p>
                    </div>
                  )}
                  {r.repair_solution && (
                    <div>
                      <h4 className="text-sm font-medium text-slate-900 mb-1">Solution</h4>
                      <p className="text-sm text-slate-600">{r.repair_solution}</p>
                    </div>
                  )}
                  {r.internal_notes && (
                    <div>
                      <h4 className="text-sm font-medium text-slate-900 mb-1">Internal Notes</h4>
                      <p className="text-sm text-slate-600">{r.internal_notes}</p>
                    </div>
                  )}
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  )
}
