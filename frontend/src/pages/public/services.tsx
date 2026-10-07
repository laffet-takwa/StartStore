import { Wrench, ShoppingCart, Monitor, Laptop, ArrowRight } from 'lucide-react'
import { Card, CardBody, Button } from '@/components/ui'
import { Link } from 'react-router-dom'
import { useI18n } from '@/i18n/context'

const services = [
  {
    icon: Wrench,
    titleKey: 'repairs.title',
    descriptionKey: 'repairs.subtitle',
    href: '/repairs',
    ctaKey: 'repairs.newRepair',
  },
  {
    icon: ShoppingCart,
    titleKey: 'shop.title',
    descriptionKey: 'shop.subtitle',
    href: '/shop',
    ctaKey: 'shop.addToCart',
  },
  {
    icon: Monitor,
    titleKey: 'common.support',
    descriptionKey: 'common.info',
    href: '/contact',
    ctaKey: 'navigation.contact',
  },
  {
    icon: Laptop,
    titleKey: 'robotics.title',
    descriptionKey: 'robotics.subtitle',
    href: '/shop',
    ctaKey: 'common.viewAll',
  },
]

export default function PublicServicesPage() {
  const { t } = useI18n()

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 page-enter">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">{t('navigation.services')}</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{t('repairs.subtitle')}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {services.map((service) => (
          <Card key={service.titleKey} hover>
            <CardBody className="p-6">
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                  <service.icon className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">{t(service.titleKey)}</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">{t(service.descriptionKey)}</p>
                  <Link to={service.href}>
                    <Button variant="outline" size="sm" icon={<ArrowRight className="h-4 w-4" />}>
                      {t(service.ctaKey)}
                    </Button>
                  </Link>
                </div>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>
    </div>
  )
}
