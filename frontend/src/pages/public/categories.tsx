import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { categoriesApi } from '@/api'
import { ArrowRight, Monitor } from 'lucide-react'
import { Card, CardBody, EmptyState } from '@/components/ui'
import { useI18n } from '@/i18n/context'
import type { Category } from '@/types'

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
}

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
}

export default function PublicCategoriesPage() {
  const { t } = useI18n()
  const { data: categoriesData } = useQuery({
    queryKey: ['public-categories'],
    queryFn: () => categoriesApi.list({ page_size: 50 }),
  })

  const categories = (categoriesData as any)?.results || []

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <motion.div variants={itemVariants} className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">{t('categories.title')}</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{t('shop.subtitle')}</p>
      </motion.div>

      {categories.length === 0 ? (
        <Card>
          <CardBody>
            <EmptyState title={t('common.noResults')} description={t('common.noData')} />
          </CardBody>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((category: Category) => (
            <motion.div key={category.id} variants={itemVariants}>
              <Link to={`/shop?category=${category.slug}`} className="group block">
                <Card hover className="h-full">
                  <CardBody className="p-6">
                    <div className="h-12 w-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4 group-hover:bg-primary group-hover:text-white transition-colors">
                      <Monitor className="h-6 w-6" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-1">{category.name}</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 line-clamp-2">
                      {category.description || `Explore our ${category.name.toLowerCase()} collection`}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-500 dark:text-slate-400">{category.product_count} {t('common.items')}</span>
                      <span className="text-sm text-primary group-hover:underline inline-flex items-center">
                        {t('common.viewAll')} <ArrowRight className="h-3 w-3 ml-1" />
                      </span>
                    </div>
                  </CardBody>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  )
}
