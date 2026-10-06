import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { customersApi } from '@/api'
import { Save } from 'lucide-react'
import { Card, CardBody, Button, Input, Badge } from '@/components/ui'
import { toast } from 'sonner'

export default function CustomerPortalProfile() {
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({ first_name: '', last_name: '', phone: '', email: '', address: '' })
  const queryClient = useQueryClient()

  const { data: customer, isLoading } = useQuery({
    queryKey: ['customer-portal-profile'],
    queryFn: async () => {
      const res = await customersApi.list({ page_size: 1 })
      const data = res as any
      return data.results?.[0] || data
    },
  })

  const updateMutation = useMutation({
    mutationFn: (data: typeof form) => customersApi.update((customer as any)?.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-portal-profile'] })
      setEditing(false)
      toast.success('Profile updated successfully')
    },
    onError: () => toast.error('Failed to update profile'),
  })

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-24 rounded-xl bg-slate-100 animate-pulse" />
        ))}
      </div>
    )
  }

  const c = customer as any

  return (
    <div className="space-y-6 page-enter max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">My Profile</h1>
        <p className="text-sm text-muted">Manage your personal information</p>
      </div>

      <Card>
        <CardBody>
          <div className="flex items-center gap-4 mb-6">
            <div className="h-16 w-16 rounded-full bg-primary text-white flex items-center justify-center text-xl font-semibold">
              {c?.first_name?.[0]}{c?.last_name?.[0]}
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">{c?.first_name} {c?.last_name}</h2>
              <Badge variant={c?.is_active ? 'success' : 'default'}>{c?.is_active ? 'Active' : 'Inactive'}</Badge>
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="First Name"
                value={editing ? form.first_name : c?.first_name || ''}
                onChange={(e) => setForm((f) => ({ ...f, first_name: e.target.value }))}
                disabled={!editing}
                leftIcon="user"
              />
              <Input
                label="Last Name"
                value={editing ? form.last_name : c?.last_name || ''}
                onChange={(e) => setForm((f) => ({ ...f, last_name: e.target.value }))}
                disabled={!editing}
                leftIcon="user"
              />
            </div>
            <Input
              label="Email"
              type="email"
              value={editing ? form.email : c?.email || ''}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              disabled={!editing}
              leftIcon="mail"
            />
            <Input
              label="Phone"
              value={editing ? form.phone : c?.phone || ''}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              disabled={!editing}
              leftIcon="phone"
            />
            <Input
              label="Address"
              value={editing ? form.address : c?.address || ''}
              onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
              disabled={!editing}
              leftIcon="map"
            />

            <div className="flex items-center gap-3 pt-2">
              {editing ? (
                <>
                  <Button onClick={() => updateMutation.mutate(form)} loading={updateMutation.isPending} icon={<Save className="h-4 w-4" />}>
                    Save Changes
                  </Button>
                  <Button variant="outline" onClick={() => setEditing(false)}>Cancel</Button>
                </>
              ) : (
                <Button onClick={() => setEditing(true)}>Edit Profile</Button>
              )}
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  )
}
