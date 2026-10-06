import { useQuery } from '@tanstack/react-query'
import { productsApi } from '@/api'
import { Link, useParams } from 'react-router-dom'
import { ShoppingCart, Heart, ArrowLeft, Package } from 'lucide-react'
import { Card, CardBody, Button, Badge } from '@/components/ui'
import type { Product } from '@/types'

export default function PublicProductDetailPage() {
  const { id } = useParams<{ id: string }>()
  const productId = id || ''

  const { data, isLoading } = useQuery({
    queryKey: ['public-product', productId],
    queryFn: () => productsApi.get(productId),
  })

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          <div className="h-8 w-32 bg-slate-200 rounded mb-6" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="aspect-square bg-slate-200 rounded-xl" />
            <div className="space-y-4">
              <div className="h-8 bg-slate-200 rounded w-3/4" />
              <div className="h-4 bg-slate-200 rounded w-1/2" />
              <div className="h-6 bg-slate-200 rounded w-1/4" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  const product = data as Product | undefined

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <p className="text-muted">Product not found.</p>
        <Link to="/shop" className="text-primary hover:underline">Back to shop</Link>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 page-enter">
      <Link to="/shop" className="inline-flex items-center gap-2 text-sm text-muted hover:text-base mb-6">
        <ArrowLeft className="h-4 w-4" />
        Back to shop
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="aspect-square rounded-xl bg-slate-100 flex items-center justify-center overflow-hidden">
          {product.image ? (
            <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
          ) : (
            <Package className="h-24 w-24 text-slate-300" />
          )}
        </div>

        <div>
          <h1 className="text-3xl font-bold text-slate-900">{product.name}</h1>
          <p className="text-sm text-muted mt-1">{product.category_name || 'General'}</p>

          <div className="mt-4 flex items-baseline gap-3">
            <span className="text-3xl font-bold text-primary">{product.selling_price.toLocaleString()} TND</span>
            <Badge variant={product.stock_quantity > 0 ? 'success' : 'danger'}>
              {product.stock_quantity > 0 ? `${product.stock_quantity} in stock` : 'Out of stock'}
            </Badge>
          </div>

          <p className="mt-4 text-sm text-muted">{product.description || 'No description available.'}</p>

          <div className="mt-6 flex items-center gap-4">
            <Button size="lg" icon={<ShoppingCart className="h-4 w-4" />} disabled={product.stock_quantity === 0}>
              Add to cart
            </Button>
            <Button variant="outline" size="lg" icon={<Heart className="h-4 w-4" />}>
              Wishlist
            </Button>
          </div>

          <div className="mt-8 border-t border-base pt-6 space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted">SKU</span>
              <span className="text-slate-900">{product.sku}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted">Category</span>
              <span className="text-slate-900">{product.category_name || '-'}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted">Brand</span>
              <span className="text-slate-900">{product.brand || '-'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
