import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Trash2, Plus, Minus, ShoppingCart, ArrowLeft, PackageOpen } from 'lucide-react'
import { Card, CardBody, Button } from '@/components/ui'
import { useCart } from '@/context/cart-context'
import { useI18n } from '@/i18n/context'

export default function CartPage() {
  const { items, removeItem, updateQuantity, total } = useCart()
  const { t } = useI18n()

  const tax = total * 0.19
  const grandTotal = total + tax

  if (items.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center"
      >
        <div className="h-16 w-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-4">
          <PackageOpen className="h-8 w-8 text-slate-400 dark:text-slate-600" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">{t('cart.emptyTitle')}</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">{t('cart.emptyDescription')}</p>
        <Link to="/shop">
          <Button icon={<ArrowLeft className="h-4 w-4" />}>{t('cart.continueShopping')}</Button>
        </Link>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 page-enter"
    >
      <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-6">{t('cart.title')}</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => (
            <Card key={item.product.id}>
              <CardBody className="p-4">
                <div className="flex items-center gap-4">
                  <div className="h-20 w-20 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {item.product.image ? (
                      <img src={item.product.image} alt={item.product.name} className="w-full h-full object-cover rounded-lg" />
                    ) : (
                      <ShoppingCart className="h-8 w-8 text-slate-400 dark:text-slate-600" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <Link to={`/products/${item.product.id}`} className="text-sm font-medium text-slate-900 dark:text-slate-100 hover:text-primary truncate block">
                      {item.product.name}
                    </Link>
                    <p className="text-sm text-primary font-semibold mt-1">{item.product.selling_price.toLocaleString()} TND</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                      className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                    >
                      <Minus className="h-4 w-4 text-slate-600 dark:text-slate-300" />
                    </button>
                    <span className="text-sm font-medium w-8 text-center tabular-nums">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                      className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                      disabled={item.quantity >= item.product.stock_quantity}
                    >
                      <Plus className="h-4 w-4 text-slate-600 dark:text-slate-300" />
                    </button>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 tabular-nums">{(item.product.selling_price * item.quantity).toLocaleString()} TND</p>
                  </div>
                  <button onClick={() => removeItem(item.product.id)} className="p-2 hover:bg-danger/10 rounded-lg transition-colors">
                    <Trash2 className="h-4 w-4 text-danger" />
                  </button>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>

        <div>
          <Card className="sticky top-24">
            <CardBody className="p-6 space-y-4">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{t('cart.checkoutTitle')}</h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500 dark:text-slate-400">{t('cart.subtotal')}</span>
                  <span className="font-medium tabular-nums">{total.toLocaleString()} TND</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500 dark:text-slate-400">{t('cart.delivery')}</span>
                  <span className="font-medium">{t('cart.freeDelivery')}</span>
                </div>
                <div className="border-t border-base pt-3 flex items-center justify-between">
                  <span className="text-base font-semibold text-slate-900 dark:text-slate-100">{t('cart.total')}</span>
                  <span className="text-lg font-bold text-primary tabular-nums">{grandTotal.toLocaleString()} TND</span>
                </div>
              </div>
              <Link to="/checkout">
                <Button className="w-full" size="lg" icon={<ShoppingCart className="h-4 w-4" />}>
                  {t('cart.checkout')}
                </Button>
              </Link>
              <Link to="/shop" className="block text-center text-sm text-primary hover:underline">
                {t('cart.continueShopping')}
              </Link>
            </CardBody>
          </Card>
        </div>
      </div>
    </motion.div>
  )
}
