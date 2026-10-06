import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { productsApi, categoriesApi } from '@/api'
import { Search, SlidersHorizontal } from 'lucide-react'
import { Card, CardBody, Badge, Button, EmptyState, Select } from '@/components/ui'
import type { Product, Category } from '@/types'

export default function PublicShopPage() {
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [sortBy, setSortBy] = useState('')

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

  const sortedProducts = useMemo(() => {
    let result = [...products]
    if (sortBy === 'price-asc') result.sort((a: Product, b: Product) => a.selling_price - b.selling_price)
    if (sortBy === 'price-desc') result.sort((a: Product, b: Product) => b.selling_price - a.selling_price)
    if (sortBy === 'name') result.sort((a: Product, b: Product) => a.name.localeCompare(b.name))
    return result
  }, [products, sortBy])

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 page-enter">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Shop</h1>
        <p className="text-sm text-muted mt-1">Discover our products</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        <aside className="lg:w-64 flex-shrink-0">
          <Card>
            <CardBody className="p-4 space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-slate-900 mb-3">Categories</h3>
                <div className="space-y-2">
                  <button
                    onClick={() => setCategoryFilter('')}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                      categoryFilter === '' ? 'bg-primary/10 text-primary font-medium' : 'text-muted hover:bg-surface-secondary'
                    }`}
                  >
                    All Categories
                  </button>
                  {categories.map((cat: Category) => (
                    <button
                      key={cat.id}
                      onClick={() => setCategoryFilter(cat.slug)}
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
                <h3 className="text-sm font-semibold text-slate-900 mb-3">Sort by</h3>
                <Select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  options={[
                    { value: '', label: 'Default' },
                    { value: 'price-asc', label: 'Price: Low to High' },
                    { value: 'price-desc', label: 'Price: High to Low' },
                    { value: 'name', label: 'Name' },
                  ]}
                  className="w-full"
                />
              </div>
            </CardBody>
          </Card>
        </aside>

        <div className="flex-1">
          <div className="mb-6">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search products..."
                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
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
                <EmptyState title="No products found" description="Try another search or browse categories." />
              </CardBody>
            </Card>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {sortedProducts.map((product: Product) => (
                <Card key={product.id} hover className="h-full">
                  <CardBody className="p-4">
                    <div className="aspect-square rounded-lg bg-slate-100 mb-4 flex items-center justify-center overflow-hidden">
                      {product.image ? (
                        <img src={product.image} alt={product.name} className="w-full h-full object-cover hover:scale-105 transition-transform duration-200" />
                      ) : (
                        <Monitor className="h-12 w-12 text-slate-300" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">{product.name}</p>
                      <p className="text-xs text-muted mt-0.5">{product.category_name || 'General'}</p>
                      <div className="mt-2 flex items-center justify-between">
                        <span className="text-sm font-semibold text-primary">{product.selling_price.toLocaleString()} TND</span>
                        <Badge variant={product.stock_quantity > 0 ? 'success' : 'danger'} size="xs">
                          {product.stock_quantity > 0 ? 'In stock' : 'Out of stock'}
                        </Badge>
                      </div>
                    </div>
                  </CardBody>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
