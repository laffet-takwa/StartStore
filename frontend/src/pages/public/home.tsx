import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { productsApi, categoriesApi } from '@/api'
import { ArrowRight, Wrench, ShoppingCart, Monitor } from 'lucide-react'
import { Card, CardBody, Button, Badge } from '@/components/ui'
import type { Product, Category } from '@/types'

const services = [
  { icon: Wrench, title: 'Repair', description: 'Professional computer and device repair services' },
  { icon: ShoppingCart, title: 'Sales', description: 'High-quality IT equipment and accessories' },
  { icon: Monitor, title: 'Support', description: 'IT consulting and technical support' },
  { icon: Laptop, title: 'Robotics', description: 'Robotics projects and educational kits' },
]

export default function PublicHomePage() {
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
    <div className="animate-fade-in">
      <section className="relative bg-surface border-b border-base overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-info/5" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24 relative">
          <div className="max-w-2xl">
            <h1 className="text-4xl md:text-5xl font-bold text-slate-900 tracking-tight">
              Technology that works for you
            </h1>
            <p className="mt-4 text-lg text-muted">
              Computers, accessories, repairs, and professional IT solutions.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link to="/shop">
                <Button size="lg" icon={<ShoppingCart className="h-4 w-4" />}>Shop products</Button>
              </Link>
              <Link to="/repairs">
                <Button variant="outline" size="lg" icon={<Wrench className="h-4 w-4" />}>Book a repair</Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h2 className="text-2xl font-bold text-slate-900 mb-6">Categories</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {categories.map((category: Category) => (
            <Link key={category.id} to={`/categories/${category.slug}`} className="group">
              <Card hover className="h-full">
                <CardBody className="flex flex-col items-center text-center p-6">
                  <div className="h-12 w-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-3 group-hover:bg-primary group-hover:text-white transition-colors">
                    <Monitor className="h-6 w-6" />
                  </div>
                  <p className="text-sm font-medium text-slate-900">{category.name}</p>
                  <p className="text-xs text-muted mt-1">{category.product_count} products</p>
                </CardBody>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-slate-900">Featured Products</h2>
          <Link to="/shop" className="text-sm text-primary hover:underline flex items-center">
            View all <ArrowRight className="h-4 w-4 ml-1" />
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.slice(0, 8).map((product: Product) => (
            <Link key={product.id} to={`/products/${product.id}`} className="group">
              <Card hover className="h-full">
                <CardBody className="p-4">
                  <div className="aspect-square rounded-lg bg-slate-100 mb-4 flex items-center justify-center overflow-hidden">
                    {product.image ? (
                      <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200" />
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
            </Link>
          ))}
        </div>
      </section>

      <section className="bg-surface border-t border-base">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h2 className="text-2xl font-bold text-slate-900 mb-8 text-center">Our Services</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {services.map((service) => (
              <Card key={service.title} hover>
                <CardBody className="text-center p-6">
                  <div className="h-12 w-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4">
                    <service.icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">{service.title}</h3>
                  <p className="text-sm text-muted">{service.description}</p>
                </CardBody>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
