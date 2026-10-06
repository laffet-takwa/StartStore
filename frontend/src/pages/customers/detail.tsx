import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { customersApi, devicesApi, repairsApi, salesApi, paymentsApi } from '@/api'
import { ArrowLeft, Phone, Mail, MapPin, Building2, Calendar, Monitor, Wrench, ShoppingCart, CreditCard } from 'lucide-react'
import { Card, CardBody, Badge, Tabs, EmptyState } from '@/components/ui'
import type { Customer, Device } from '@/types'

export default function CustomerDetailPage() {
  const { id } = useParams()
  const { data: customer, isLoading: customerLoading } = useQuery({
    queryKey: ['customer', id],
    queryFn: () => customersApi.get(id!),
    enabled: !!id,
  })

  const { data: devices } = useQuery({
    queryKey: ['devices', 'customer', id],
    queryFn: () => devicesApi.list({ customer: id!, page_size: 50 }),
    enabled: !!id,
  })

  const { data: repairs } = useQuery({
    queryKey: ['repairs', 'customer', id],
    queryFn: () => repairsApi.list({ customer: id!, page_size: 50 }),
    enabled: !!id,
  })

  const { data: sales } = useQuery({
    queryKey: ['sales', 'customer', id],
    queryFn: () => salesApi.list({ customer: id!, page_size: 50 }),
    enabled: !!id,
  })

  const { data: payments } = useQuery({
    queryKey: ['payments', 'customer', id],
    queryFn: () => paymentsApi.list({ customer: id!, page_size: 50 }),
    enabled: !!id,
  })

  if (customerLoading || !customer) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const c = customer as Customer
  const deviceList = (devices as any)?.results || []
  const repairList = (repairs as any)?.results || []
  const salesList = (sales as any)?.results || []
  const paymentList = (payments as any)?.results || []

  return (
    <div className="space-y-6 page-enter">
      <div className="flex items-center gap-4">
        <Link to="/customers" className="p-2 hover:bg-slate-100 rounded-md">
          <ArrowLeft className="h-5 w-5 text-slate-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {c.first_name} {c.last_name}
          </h1>
          <p className="text-sm text-muted">Customer Details</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardBody>
              <h3 className="font-semibold text-slate-900 mb-4">Contact Information</h3>
              <div className="space-y-3">
                {c.phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-muted" />
                    <span className="text-slate-600">{c.phone}</span>
                  </div>
                )}
                {c.email && (
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-muted" />
                    <span className="text-slate-600">{c.email}</span>
                  </div>
                )}
                {c.address && (
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted" />
                    <span className="text-slate-600">{c.address}</span>
                  </div>
                )}
                {c.company_name && (
                  <div className="flex items-center gap-2 text-sm">
                    <Building2 className="h-4 w-4 text-muted" />
                    <span className="text-slate-600">{c.company_name}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted" />
                  <span className="text-slate-600">Since {new Date(c.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <h3 className="font-semibold text-slate-900 mb-3">Statistics</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 rounded-md">
                  <p className="text-xs text-muted">Devices</p>
                  <p className="text-lg font-semibold">{c.device_count}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-md">
                  <p className="text-xs text-muted">Repairs</p>
                  <p className="text-lg font-semibold">{c.repair_count}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-md col-span-2">
                  <p className="text-xs text-muted">Total Spent</p>
                  <p className="text-lg font-semibold">{c.total_spent?.toLocaleString() ?? 0} TND</p>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Card>
            <CardBody>
              <Tabs
                tabs={[
                  { id: 'devices', label: `Devices (${deviceList.length})`, icon: <Monitor className="h-4 w-4" /> },
                  { id: 'repairs', label: `Repairs (${repairList.length})`, icon: <Wrench className="h-4 w-4" /> },
                  { id: 'sales', label: `Sales (${salesList.length})`, icon: <ShoppingCart className="h-4 w-4" /> },
                  { id: 'payments', label: `Payments (${paymentList.length})`, icon: <CreditCard className="h-4 w-4" /> },
                ]}
                activeTab="devices"
                onChange={() => {}}
              />
              <div className="mt-4 space-y-3">
                <div className="space-y-3">
                  {deviceList.length === 0 ? (
                    <EmptyState title="No devices" description="This customer has no registered devices." />
                  ) : (
                    deviceList.map((device: Device) => (
                      <Link key={device.id} to={`/devices/${device.id}`} className="block p-3 rounded-lg border border-slate-100 hover:border-primary/20 hover:bg-primary/5 transition-colors">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-slate-900">{device.brand} {device.model}</p>
                            <p className="text-xs text-muted">{device.device_type_display}</p>
                          </div>
                          <Badge variant="info">{device.repair_count} repairs</Badge>
                        </div>
                      </Link>
                    ))
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
