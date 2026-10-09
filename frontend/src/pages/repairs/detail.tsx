import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { repairsApi } from '@/api'
import { ArrowLeft, Clock, Wrench, User, Printer, Download } from 'lucide-react'
import { toast } from 'sonner'
import { Card, CardBody, Badge, Button, Tabs } from '@/components/ui'
import { StatusTimeline, type Step } from '@/components/ui/status-timeline'
import { ImageLightbox } from '@/components/ui/image-lightbox'
import { useI18n } from '@/i18n/context'
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
  const { t } = useI18n()
  const [activeTab, setActiveTab] = useState('details')
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(0)

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

  const statusSteps: Step[] = [
    { key: 'received', label: 'Received', description: 'Repair ticket created', status: 'completed', timestamp: new Date(r.received_at).toLocaleString() },
    { key: 'diagnosis', label: 'Diagnosis', description: r.diagnosis || 'Awaiting diagnosis', status: ['diagnosis', 'waiting_customer', 'approved', 'repairing', 'testing', 'ready', 'delivered'].includes(r.status) ? 'completed' : r.status === 'diagnosis' ? 'current' : 'pending', timestamp: r.diagnosed_at ? new Date(r.diagnosed_at).toLocaleString() : undefined },
    { key: 'waiting_customer', label: 'Waiting for Customer', description: 'Awaiting customer approval', status: ['approved', 'repairing', 'testing', 'ready', 'delivered'].includes(r.status) ? 'completed' : r.status === 'waiting_customer' ? 'current' : 'pending' },
    { key: 'approved', label: 'Approved', description: 'Customer approved the repair', status: ['repairing', 'testing', 'ready', 'delivered'].includes(r.status) ? 'completed' : r.status === 'approved' ? 'current' : 'pending', timestamp: r.approved_at ? new Date(r.approved_at).toLocaleString() : undefined },
    { key: 'repairing', label: 'Repairing', description: 'Technician is working on the repair', status: ['testing', 'ready', 'delivered'].includes(r.status) ? 'completed' : r.status === 'repairing' ? 'current' : 'pending', timestamp: r.started_at ? new Date(r.started_at).toLocaleString() : undefined },
    { key: 'testing', label: 'Testing', description: 'Quality assurance testing', status: ['ready', 'delivered'].includes(r.status) ? 'completed' : r.status === 'testing' ? 'current' : 'pending', timestamp: r.tested_at ? new Date(r.tested_at).toLocaleString() : undefined },
    { key: 'ready', label: 'Ready for Pickup', description: 'Repair completed and ready', status: r.status === 'delivered' ? 'completed' : r.status === 'ready' ? 'current' : 'pending', timestamp: r.ready_at ? new Date(r.ready_at).toLocaleString() : undefined },
    { key: 'delivered', label: 'Delivered', description: 'Device returned to customer', status: r.status === 'delivered' ? 'completed' : 'pending', timestamp: r.delivered_at ? new Date(r.delivered_at).toLocaleString() : undefined },
  ]

  if (r.status === 'cancelled') {
    statusSteps.push({ key: 'cancelled', label: 'Cancelled', description: 'Repair was cancelled', status: 'cancelled', timestamp: r.cancelled_at ? new Date(r.cancelled_at).toLocaleString() : undefined })
  }

  const repairImages = (r.images || []).map((img: any) => img.image)

  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link to="/repairs" className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
            <ArrowLeft className="h-5 w-5 text-slate-600" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{r.ticket_number}</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">{t('repairs.repairDetail')}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" icon={<Printer className="h-4 w-4" />}>{t('common.print')}</Button>
          <Button variant="outline" size="sm" icon={<Download className="h-4 w-4" />}>{t('common.export')}</Button>
        </div>
      </div>

      {availableTransitions.length > 0 && (
        <Card>
          <CardBody>
            <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-3">Update Status</h3>
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
              <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-4">Customer & Device</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4 text-slate-400" />
                  <span className="text-slate-600 dark:text-slate-300">{r.customer.first_name} {r.customer.last_name}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Wrench className="h-4 w-4 text-slate-400" />
                  <span className="text-slate-600 dark:text-slate-300">{r.device.brand} {r.device.model}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-slate-400" />
                  <span className="text-slate-600 dark:text-slate-300">Received {new Date(r.received_at).toLocaleString()}</span>
                </div>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">Current Status</h3>
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
                activeTab={activeTab}
                onChange={setActiveTab}
              />
              <div className="mt-6">
                {activeTab === 'details' && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                    <div>
                      <h4 className="text-sm font-medium text-slate-900 dark:text-slate-100 mb-1">Problem Description</h4>
                      <p className="text-sm text-slate-600 dark:text-slate-300">{r.problem_description}</p>
                    </div>
                    {r.diagnosis && (
                      <div>
                        <h4 className="text-sm font-medium text-slate-900 dark:text-slate-100 mb-1">Diagnosis</h4>
                        <p className="text-sm text-slate-600 dark:text-slate-300">{r.diagnosis}</p>
                      </div>
                    )}
                    {r.repair_solution && (
                      <div>
                        <h4 className="text-sm font-medium text-slate-900 dark:text-slate-100 mb-1">Solution</h4>
                        <p className="text-sm text-slate-600 dark:text-slate-300">{r.repair_solution}</p>
                      </div>
                    )}
                    {r.internal_notes && (
                      <div>
                        <h4 className="text-sm font-medium text-slate-900 dark:text-slate-100 mb-1">Internal Notes</h4>
                        <p className="text-sm text-slate-600 dark:text-slate-300">{r.internal_notes}</p>
                      </div>
                    )}
                  </motion.div>
                )}
                {activeTab === 'parts' && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    {(r.parts || []).length === 0 ? (
                      <p className="text-sm text-slate-500 dark:text-slate-400">No parts used yet.</p>
                    ) : (
                      <div className="space-y-2">
                        {(r.parts || []).map((part: any) => (
                          <div key={part.id} className="flex items-center justify-between p-3 rounded-lg border border-slate-100 dark:border-slate-700">
                            <div>
                              <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{part.product?.name || 'Part'}</p>
                              <p className="text-xs text-slate-500 dark:text-slate-400">Qty: {part.quantity} × {part.unit_price?.toLocaleString()} TND</p>
                            </div>
                            <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">{part.total_price?.toLocaleString()} TND</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}
                {activeTab === 'images' && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    {repairImages.length === 0 ? (
                      <p className="text-sm text-slate-500 dark:text-slate-400">No images uploaded yet.</p>
                    ) : (
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {repairImages.map((src: string, i: number) => (
                          <button
                            key={i}
                            onClick={() => { setLightboxIndex(i); setLightboxOpen(true) }}
                            className="aspect-square rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 hover:border-primary/30 transition-colors"
                          >
                            <img src={src} alt={`Repair image ${i + 1}`} className="w-full h-full object-cover" />
                          </button>
                        ))}
                      </div>
                    )}
                    <ImageLightbox
                      images={repairImages}
                      initialIndex={lightboxIndex}
                      open={lightboxOpen}
                      onClose={() => setLightboxOpen(false)}
                      altPrefix="Repair image"
                    />
                  </motion.div>
                )}
                {activeTab === 'timeline' && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <StatusTimeline steps={statusSteps} />
                  </motion.div>
                )}
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </motion.div>
  )
}
