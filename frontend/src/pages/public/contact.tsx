import { useState } from 'react'
import { motion } from 'framer-motion'
import { MapPin, Phone, Mail, Send, Clock } from 'lucide-react'
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

  const contactInfo = [
    { icon: MapPin, titleKey: 'navigation.contact', text: 'Tunis, Tunisia' },
    { icon: Phone, titleKey: 'common.phone', text: '+216 XX XXX XXX' },
    { icon: Mail, titleKey: 'auth.email', text: 'contact@starstore.tn' },
    { icon: Clock, titleKey: 'common.date', text: 'Mon-Fri: 9AM-6PM' },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
    >
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">{t('navigation.contact')}</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{t('common.info')}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-4">
          {contactInfo.map((item) => (
            <Card key={item.titleKey} className="border-0 shadow-sm">
              <CardBody className="p-5 flex items-start gap-4">
                <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                  <item.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{t(item.titleKey)}</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{item.text}</p>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>

        <div className="lg:col-span-2">
          <Card className="border-0 shadow-sm">
            <CardBody className="p-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input label={t('auth.firstName')} required />
                  <Input label={t('auth.lastName')} required />
                </div>
                <Input label={t('auth.email')} type="email" required />
                <Input label={t('common.subject') || 'Subject'} required />
                <Textarea label={t('common.description')} rows={5} required />
                <Button type="submit" loading={loading} icon={<Send className="h-4 w-4" />} size="lg">
                  {t('common.submit')}
                </Button>
              </form>
            </CardBody>
          </Card>
        </div>
      </div>
    </motion.div>
  )
}
