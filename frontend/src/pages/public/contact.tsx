import { useState } from 'react'
import { MapPin, Phone, Mail, Send } from 'lucide-react'
import { Card, CardBody, Button, Input, Textarea } from '@/components/ui'
import { toast } from 'sonner'
import { useI18n } from '@/i18n/context'

export default function PublicContactPage() {
  const { t } = useI18n()
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    await new Promise((resolve) => setTimeout(resolve, 800))
    setLoading(false)
    toast.success(t('common.success'))
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 page-enter">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">{t('navigation.contact')}</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{t('common.info')}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardBody className="p-5 space-y-4">
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-slate-900">{t('navigation.contact')}</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Tunis, Tunisia</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Phone className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-slate-900">+216 XX XXX XXX</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Mail className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-slate-900">contact@starstore.tn</p>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Card>
            <CardBody className="p-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-slate-700">{t('auth.firstName')}</label>
                    <Input required />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-slate-700">{t('auth.lastName')}</label>
                    <Input required />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-slate-700">{t('auth.email')}</label>
                  <Input type="email" required />
                </div>
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-slate-700">{t('common.subject') || 'Subject'}</label>
                  <Input required />
                </div>
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-slate-700">{t('common.description')}</label>
                  <Textarea rows={5} required />
                </div>
                <Button type="submit" loading={loading} icon={<Send className="h-4 w-4" />}>
                  {t('common.submit')}
                </Button>
              </form>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  )
}
