import { useState } from 'react'
import { motion } from 'framer-motion'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { customersApi } from '@/api'
import { Save, User } from 'lucide-react'
import { Card, CardBody, Button, Input, Badge } from '@/components/ui'
import { toast } from 'sonner'
import { useI18n } from '@/i18n/context'

export default function CustomerPortalProfile() {
  const { t } = useI18n()
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
      toast.success(t('common.success'))
    },
    onError: () => toast.error('Failed to update profile'),
  })

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-24 rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
        ))}
      </div>
    )
  }

  const c = customer as any

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6 max-w-3xl"
    >
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{t('navigation.profile')}</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">{t('common.description')}</p>
      </div>

      <Card className="border-0 shadow-sm">
        <CardBody>
          <div className="flex items-center gap-4 mb-6">
            <div className="h-16 w-16 rounded-full bg-primary text-white flex items-center justify-center text-xl font-semibold">
              {c?.first_name?.[0]}{c?.last_name?.[0]}
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{c?.first_name} {c?.last_name}</h2>
              <Badge variant={c?.is_active ? 'success' : 'default'}>{c?.is_active ? t('common.active') : t('common.inactive')}</Badge>
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label={t('auth.firstName')}
                value={editing ? form.first_name : c?.first_name || ''}
                onChange={(e) => setForm((f) => ({ ...f, first_name: e.target.value }))}
                disabled={!editing}
                leftIcon={<User className="h-4 w-4" />}
              />
              <Input
                label={t('auth.lastName')}
                value={editing ? form.last_name : c?.last_name || ''}
                onChange={(e) => setForm((f) => ({ ...f, last_name: e.target.value }))}
                disabled={!editing}
                leftIcon={<User className="h-4 w-4" />}
              />
            </div>
            <Input
              label={t('auth.email')}
              type="email"
              value={editing ? form.email : c?.email || ''}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              disabled={!editing}
              leftIcon={<User className="h-4 w-4" />}
            />
            <Input
              label={t('common.phone')}
              value={editing ? form.phone : c?.phone || ''}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              disabled={!editing}
              leftIcon={<User className="h-4 w-4" />}
            />
            <Input
              label={t('common.address')}
              value={editing ? form.address : c?.address || ''}
              onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
              disabled={!editing}
              leftIcon={<User className="h-4 w-4" />}
            />

            <div className="flex items-center gap-3 pt-2">
              {editing ? (
                <>
                  <Button onClick={() => updateMutation.mutate(form)} loading={updateMutation.isPending} icon={<Save className="h-4 w-4" />}>
                    {t('common.save')}
                  </Button>
                  <Button variant="outline" onClick={() => setEditing(false)}>{t('common.cancel')}</Button>
                </>
              ) : (
                <Button onClick={() => setEditing(true)}>{t('common.edit')}</Button>
              )}
            </div>
          </div>
        </CardBody>
      </Card>
    </motion.div>
  )
}
