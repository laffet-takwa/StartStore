import { motion } from 'framer-motion'
import { Wrench, ShoppingCart, Monitor, Laptop, ArrowRight } from 'lucide-react'
import { Card, CardBody, Button } from '@/components/ui'
import { Link } from 'react-router-dom'
import { useI18n } from '@/i18n/context'
import { cn } from '@/utils/cn'

const services = [
  {
    icon: Wrench,
    titleKey: 'repairs.title',
    descriptionKey: 'repairs.subtitle',
    href: '/repairs',
    ctaKey: 'repairs.newRepair',
    color: 'text-primary bg-primary/10',
  },
  {
    icon: ShoppingCart,
    titleKey: 'shop.title',
    descriptionKey: 'shop.subtitle',
    href: '/shop',
    ctaKey: 'shop.addToCart',
    color: 'text-success bg-success/10',
  },
  {
    icon: Monitor,
    titleKey: 'common.support',
    descriptionKey: 'common.info',
    href: '/contact',
    ctaKey: 'navigation.contact',
    color: 'text-info bg-info/10',
  },
  {
    icon: Laptop,
    titleKey: 'robotics.title',
    descriptionKey: 'robotics.subtitle',
    href: '/shop',
    ctaKey: 'common.viewAll',
    color: 'text-warning bg-warning/10',
  },
]

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
}

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
}

export default function PublicServicesPage() {
  const { t } = useI18n()

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <motion.div variants={itemVariants} className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">{t('navigation.services')}</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{t('repairs.subtitle')}</p>
      </motion.div>

      <motion.div variants={containerVariants} className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {services.map((service) => (
          <motion.div key={service.titleKey} variants={itemVariants}>
            <Card hover>
              <CardBody className="p-6">
                <div className="flex items-start gap-4">
                  <div className={cn('h-12 w-12 rounded-xl flex items-center justify-center flex-shrink-0', service.color)}>
                    <service.icon className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">{t(service.titleKey)}</h3>
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
          </motion.div>
        ))}
      </motion.div>
    </motion.div>
  )
}
