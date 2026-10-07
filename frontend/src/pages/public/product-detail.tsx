import { useQuery } from '@tanstack/react-query'
import { productsApi } from '@/api'
import { Link, useParams } from 'react-router-dom'
import { ShoppingCart, Heart, ArrowLeft } from 'lucide-react'
import { Button, Badge } from '@/components/ui'
import { AppImage } from '@/components/ui'
import { useCart } from '@/context/cart-context'
import { useI18n } from '@/i18n/context'
import { toast } from 'sonner'
import { resolveProductImage } from '@/utils/images'
import type { Product } from '@/types'

export default function PublicProductDetailPage() {
  const { id } = useParams<{ id: string }>()
  const productId = id || ''
  const { addItem } = useCart()
  const { t } = useI18n()

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
        <p className="text-slate-500 dark:text-slate-400">Product not found.</p>
        <Link to="/shop" className="text-primary hover:underline">Back to shop</Link>
      </div>
    )
  }

  const handleAddToCart = () => {
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 page-enter">
      <Link to="/shop" className="inline-flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 hover:text-base mb-6">
        <ArrowLeft className="h-4 w-4" />
        {t('shop.backToShop')}
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="aspect-square rounded-xl bg-slate-100 overflow-hidden">
          <AppImage
            src={resolveProductImage(product)}
            alt={product.name}
            objectFit="contain"
            priority
            className="p-6"
          />
        </div>

        <div>
          <h1 className="text-3xl font-bold text-slate-900">{product.name}</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{product.category_name || t('shop.category')}</p>

          <div className="mt-4 flex items-baseline gap-3">
            <span className="text-3xl font-bold text-primary">{product.selling_price.toLocaleString()} TND</span>
            <Badge variant={product.stock_quantity > 0 ? 'success' : 'danger'}>
              {product.stock_quantity > 0 ? `${product.stock_quantity} ${t('shop.inStock')}` : t('shop.outOfStock')}
            </Badge>
          </div>

          <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">{product.description || t('shop.noDescription')}</p>

          <div className="mt-6 flex items-center gap-4">
            <Button size="lg" icon={<ShoppingCart className="h-4 w-4" />} disabled={product.stock_quantity === 0} onClick={handleAddToCart}>
              {t('shop.addToCart')}
            </Button>
            <Button variant="outline" size="lg" icon={<Heart className="h-4 w-4" />}>
              {t('shop.wishlist')}
            </Button>
          </div>

            <div className="mt-8 border-t border-base pt-6 space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500 dark:text-slate-400">{t('products.sku')}</span>
                <span className="text-slate-900">{product.sku}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500 dark:text-slate-400">{t('shop.category')}</span>
                <span className="text-slate-900">{product.category_name || '-'}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500 dark:text-slate-400">{t('products.brand') || 'Brand'}</span>
                <span className="text-slate-900">{product.brand || '-'}</span>
              </div>
            </div>
        </div>
      </div>
    </div>
  )
}
