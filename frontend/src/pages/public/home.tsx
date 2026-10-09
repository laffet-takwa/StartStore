import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { productsApi, categoriesApi } from '@/api'
import {
  ArrowRight,
  Wrench,
  ShoppingCart,
  Monitor,
  Laptop,
  ChevronRight,
  ShieldCheck,
  Truck,
  Headphones,
  Star,
} from 'lucide-react'
import { Card, CardBody, Button, Badge } from '@/components/ui'
import { HERO_IMAGE, resolveProductImage, resolveCategoryImage, resolveServiceImage } from '@/utils/images'
import { useI18n } from '@/i18n/context'
import type { Product, Category } from '@/types'

const services = [
  { icon: Wrench, titleKey: 'repairs.title', descriptionKey: 'repairs.subtitle', slug: 'repair' },
  { icon: ShoppingCart, titleKey: 'shop.title', descriptionKey: 'shop.subtitle', slug: 'sales' },
  { icon: Monitor, titleKey: 'common.notes', descriptionKey: 'customers.subtitle', slug: 'support' },
  { icon: Laptop, titleKey: 'robotics.title', descriptionKey: 'robotics.subtitle', slug: 'robotics' },
]

const trustBadges = [
  { icon: ShieldCheck, labelKey: 'home.trustWarranty' },
  { icon: Truck, labelKey: 'home.trustDelivery' },
  { icon: Headphones, labelKey: 'home.trustSupport' },
  { icon: Star, labelKey: 'home.trustQuality' },
]

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.08 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
}

export default function PublicHomePage() {
  const { t } = useI18n()
  const { data: productsData } = useQuery({
    queryKey: ['public-products'],
    queryFn: () => productsApi.list({ page_size: 8 }),
  })

  const { data: categoriesData } = useQuery({
    queryKey: ['public-categories'],
    queryFn: () => categoriesApi.list({ page_size: 6 }),
  })

  const products = (productsData as any)?.results || []
  const categories = (categoriesData as any)?.results || []

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible">
      {/* Hero */}
      <section className="relative bg-surface border-b border-base overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-info/5" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24 relative">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            <motion.div variants={itemVariants} className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-wider text-primary mb-3">STAR STORE</p>
              <h1 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-slate-100 tracking-tight text-balance">
                {t('shop.title')}
              </h1>
              <p className="mt-4 text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
                {t('shop.subtitle')}
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <Link to="/shop">
                  <Button size="lg" icon={<ShoppingCart className="h-4 w-4" />}>{t('navigation.shop')}</Button>
                </Link>
                <Link to="/repairs">
                  <Button variant="outline" size="lg" icon={<Wrench className="h-4 w-4" />}>{t('repairs.title')}</Button>
                </Link>
              </div>
              <div className="mt-8 flex flex-wrap items-center gap-6 text-sm text-slate-600 dark:text-slate-300">
                {trustBadges.map((badge) => (
                  <div key={badge.labelKey} className="flex items-center gap-2">
                    <badge.icon className="h-4 w-4 text-primary" />
                    <span>{t(badge.labelKey)}</span>
                  </div>
                ))}
              </div>
            </motion.div>
            <motion.div variants={itemVariants} className="hidden lg:block">
              <div className="relative">
                <div className="absolute -inset-4 bg-gradient-to-r from-primary/20 to-info/20 rounded-3xl blur-2xl" />
                <motion.img
                  src={HERO_IMAGE}
                  alt="STAR STORE IT equipment and repair services"
                  className="relative rounded-2xl shadow-2xl w-full object-cover aspect-[4/3]"
                  loading="eager"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.6, ease: 'easeOut' }}
                />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <motion.div variants={itemVariants} className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{t('categories.title')}</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{t('shop.subtitle')}</p>
          </div>
          <Link to="/categories" className="text-sm text-primary hover:text-primary-hover font-medium flex items-center gap-1">
            {t('common.viewAll')} <ChevronRight className="h-4 w-4" />
          </Link>
        </motion.div>
        <motion.div variants={containerVariants} className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {categories.map((category: Category) => (
            <motion.div key={category.id} variants={itemVariants}>
              <Link to={`/categories/${category.slug}`} className="group block">
                <Card hover className="h-full">
                  <CardBody className="flex flex-col items-center text-center p-5">
                    <div className="h-12 w-12 rounded-xl overflow-hidden bg-slate-100 mb-3">
                      <img
                        src={resolveCategoryImage(category)}
                        alt={category.name}
                        className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-200"
                        loading="lazy"
                      />
                    </div>
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{category.name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{category.product_count} {t('common.items')}</p>
                  </CardBody>
                </Card>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Featured Products */}
      <section className="bg-surface border-t border-base">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
          <motion.div variants={itemVariants} className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{t('shop.relatedProducts')}</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{t('shop.subtitle')}</p>
            </div>
            <Link to="/shop" className="text-sm text-primary hover:text-primary-hover font-medium flex items-center gap-1">
              {t('common.viewAll')} <ArrowRight className="h-4 w-4" />
            </Link>
          </motion.div>
          <motion.div variants={containerVariants} className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.slice(0, 8).map((product: Product) => (
              <motion.div key={product.id} variants={itemVariants}>
                <Link to={`/products/${product.id}`} className="group block">
                  <Card hover className="h-full flex flex-col">
                    <CardBody className="p-4 flex flex-col flex-1">
                      <div className="aspect-square rounded-lg bg-slate-100 mb-4 flex items-center justify-center overflow-hidden">
                        <img
                          src={resolveProductImage(product)}
                          alt={product.name}
                          className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-200"
                          loading="lazy"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">{product.name}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{product.category_name || t('shop.category')}</p>
                        <div className="mt-2 flex items-center justify-between">
                          <span className="text-sm font-semibold text-primary">{product.selling_price.toLocaleString()} TND</span>
                          <Badge variant={product.stock_quantity > 0 ? 'success' : 'danger'} size="xs">
                            {product.stock_quantity > 0 ? t('shop.inStock') : t('shop.outOfStock')}
                          </Badge>
                        </div>
                      </div>
                    </CardBody>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Services */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <motion.div variants={itemVariants} className="text-center mb-10">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{t('navigation.services')}</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{t('repairs.subtitle')}</p>
        </motion.div>
        <motion.div variants={containerVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {services.map((service) => (
            <motion.div key={service.slug} variants={itemVariants}>
              <Card hover>
                <CardBody className="text-center p-6">
                  <div className="h-12 w-12 rounded-xl overflow-hidden bg-slate-100 mx-auto mb-4">
                    <img
                      src={resolveServiceImage({ title: service.titleKey, slug: service.slug })}
                      alt={t(service.titleKey)}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">{t(service.titleKey)}</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{t(service.descriptionKey)}</p>
                </CardBody>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Why STAR STORE */}
      <section className="bg-surface border-t border-b border-base">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
          <motion.div variants={itemVariants} className="text-center mb-10">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{t('home.whyStarStore')}</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{t('home.whyStarStoreSubtitle')}</p>
          </motion.div>
          <motion.div variants={containerVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {trustBadges.map((badge) => (
              <motion.div key={badge.labelKey} variants={itemVariants}>
                <Card>
                  <CardBody className="text-center p-6">
                    <div className="h-12 w-12 rounded-xl bg-primary/10 text-primary mx-auto mb-4 flex items-center justify-center">
                      <badge.icon className="h-6 w-6" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-1">{t(badge.labelKey)}</h3>
                  </CardBody>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>
    </motion.div>
  )
}
