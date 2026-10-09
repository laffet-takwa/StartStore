import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { productsApi, categoriesApi } from '@/api'
import { Search, ShoppingCart, SlidersHorizontal, X } from 'lucide-react'
import { Card, CardBody, Badge, Button, EmptyState, Select } from '@/components/ui'
import { AppImage } from '@/components/ui'
import { useCart } from '@/context/cart-context'
import { useI18n } from '@/i18n/context'
import { toast } from 'sonner'
import { resolveProductImage } from '@/utils/images'
import type { Product, Category } from '@/types'

export default function PublicShopPage() {
  const { t } = useI18n()
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [sortBy, setSortBy] = useState('')
  const [filtersOpen, setFiltersOpen] = useState(false)
  const { addItem } = useCart()

  const { data: productsData, isLoading } = useQuery({
    queryKey: ['public-shop-products', search, categoryFilter, sortBy],
    queryFn: () => productsApi.list({ search, category: categoryFilter, page_size: 50 }),
  })

  const { data: categoriesData } = useQuery({
    queryKey: ['public-shop-categories'],
    queryFn: () => categoriesApi.list({ page_size: 20 }),
  })

  const products = (productsData as any)?.results || []
  const categories = (categoriesData as any)?.results || []
  const activeFilterCount = [categoryFilter, sortBy].filter(Boolean).length

  const sortedProducts = useMemo(() => {
    let result = [...products]
    if (sortBy === 'price-asc') result.sort((a: Product, b: Product) => a.selling_price - b.selling_price)
    if (sortBy === 'price-desc') result.sort((a: Product, b: Product) => b.selling_price - a.selling_price)
    if (sortBy === 'name') result.sort((a: Product, b: Product) => a.name.localeCompare(b.name))
    return result
  }, [products, sortBy])

  const handleAddToCart = (product: Product) => {
    if (product.stock_quantity > 0) {
      addItem({
        id: product.id,
        name: product.name,
        selling_price: product.selling_price,
        stock_quantity: product.stock_quantity,
        image: product.image,
      })
      toast.success('Added to cart')
    }
  }

  const FilterSidebar = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold text-slate-900 mb-3">{t('categories.title')}</h3>
        <div className="space-y-1.5">
          <button
            onClick={() => { setCategoryFilter(''); setFiltersOpen(false) }}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
              categoryFilter === '' ? 'bg-primary/10 text-primary font-medium' : 'text-muted hover:bg-surface-secondary'
            }`}
          >
            {t('shop.allCategories')}
          </button>
          {categories.map((cat: Category) => (
            <button
              key={cat.id}
              onClick={() => { setCategoryFilter(cat.slug); setFiltersOpen(false) }}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                categoryFilter === cat.slug ? 'bg-primary/10 text-primary font-medium' : 'text-muted hover:bg-surface-secondary'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

        <div>
          <h3 className="text-sm font-semibold text-slate-900 mb-3">{t('common.sortBy')}</h3>
          <Select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            options={[
              { value: '', label: t('shop.sortDefault') },
              { value: 'price-asc', label: t('shop.sortPriceAsc') },
              { value: 'price-desc', label: t('shop.sortPriceDesc') },
              { value: 'name', label: t('shop.sortName') },
            ]}
            className="w-full"
          />
        </div>

      {(categoryFilter || sortBy) && (
        <Button
          variant="ghost"
          size="sm"
          className="w-full"
          onClick={() => { setCategoryFilter(''); setSortBy('') }}
        >
          <X className="h-4 w-4 mr-2" />
          {t('shop.clearFilters')}
        </Button>
      )}
    </div>
  )

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 page-enter">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">{t('shop.title')}</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{t('shop.subtitle')}</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        <aside className="hidden lg:block lg:w-64 flex-shrink-0">
          <Card>
            <CardBody className="p-5">
              <FilterSidebar />
            </CardBody>
          </Card>
        </aside>

        <div className="flex-1">
          <div className="flex items-center gap-3 mb-6">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t('shop.searchPlaceholder')}
                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 bg-white dark:bg-dark-surface dark:border-slate-700 dark:text-slate-100"
              />
            </div>
            <button
              onClick={() => setFiltersOpen(true)}
              className="lg:hidden inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border border-slate-200 hover:bg-slate-50"
            >
              <SlidersHorizontal className="h-4 w-4" />
              {t('common.filters')}
              {activeFilterCount > 0 && (
                <span className="h-5 w-5 rounded-full bg-primary text-white text-xs flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-80 rounded-xl bg-slate-100 animate-pulse" />
              ))}
            </div>
          ) : sortedProducts.length === 0 ? (
              <Card>
                <CardBody>
                  <EmptyState title={t('shop.noProductsFound')} description={t('shop.tryAnotherSearch')} />
                </CardBody>
              </Card>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {sortedProducts.map((product: Product) => (
                <Card key={product.id} hover className="h-full flex flex-col">
                  <CardBody className="p-4 flex flex-col flex-1">
                    <div className="aspect-square rounded-lg bg-slate-100 mb-4 flex items-center justify-center overflow-hidden">
                      <AppImage
                        src={resolveProductImage(product)}
                        alt={product.name}
                        objectFit="contain"
                        className="p-2"
                        priority={false}
                      />
                    </div>
                     <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-slate-900 truncate">{product.name}</p>
                       <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{product.category_name || t('shop.category')}</p>
                      <div className="mt-2 flex items-center justify-between">
                        <span className="text-sm font-semibold text-primary">{product.selling_price.toLocaleString()} TND</span>
                        <Badge variant={product.stock_quantity > 0 ? 'success' : 'danger'} size="xs">
                          {product.stock_quantity > 0 ? t('shop.inStock') : t('shop.outOfStock')}
                        </Badge>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      className="w-full mt-3"
                      icon={<ShoppingCart className="h-4 w-4" />}
                      disabled={product.stock_quantity === 0}
                      onClick={() => handleAddToCart(product)}
                    >
                      {t('shop.addToCart')}
                    </Button>
                  </CardBody>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {filtersOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setFiltersOpen(false)} />
          <div className="absolute bottom-0 left-0 right-0 bg-white dark:bg-dark-surface rounded-t-2xl p-5 max-h-[70vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">{t('common.filters')}</h3>
              <button onClick={() => setFiltersOpen(false)} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-dark-surface-secondary">
                <X className="h-4 w-4" />
              </button>
            </div>
            <FilterSidebar />
          </div>
        </div>
      )}
    </div>
  )
}
