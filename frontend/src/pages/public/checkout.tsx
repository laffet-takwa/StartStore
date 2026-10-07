import { useState } from 'react'
import { Link } from 'react-router-dom'
import { CheckCircle } from 'lucide-react'
import { Card, CardBody, Button } from '@/components/ui'
import { useCart } from '@/context/cart-context'
import { useI18n } from '@/i18n/context'

export default function CheckoutPage() {
  const { items, total, clearCart } = useCart()
  const { t } = useI18n()
  const [submitted, setSubmitted] = useState(false)

  const tax = total * 0.19
  const grandTotal = total + tax

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
    clearCart()
  }

  if (submitted) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center page-enter">
        <div className="h-16 w-16 rounded-full bg-success/10 text-success flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="h-8 w-8" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">{t('cart.orderSuccess')}</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">{t('cart.orderSuccessMessage')}</p>
        <div className="flex items-center justify-center gap-4">
          <Link to="/shop">
            <Button variant="outline">{t('cart.continueShopping')}</Button>
          </Link>
          <Link to="/">
            <Button>{t('navigation.home')}</Button>
          </Link>
        </div>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center page-enter">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">{t('cart.emptyTitle')}</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">{t('cart.emptyDescription')}</p>
        <Link to="/shop">
          <Button>{t('shop.title')}</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 page-enter">
      <h1 className="text-2xl font-bold text-slate-900 mb-6">{t('cart.checkoutTitle')}</h1>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardBody className="p-6 space-y-4">
              <h2 className="text-lg font-semibold text-slate-900">{t('common.name')}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-slate-700">{t('auth.firstName')}</label>
                  <input type="text" className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20" required />
                </div>
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-slate-700">{t('auth.lastName')}</label>
                  <input type="text" className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20" required />
                </div>
              </div>
              <div className="space-y-1">
                <label className="block text-sm font-medium text-slate-700">{t('auth.email')}</label>
                <input type="email" className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20" required />
              </div>
              <div className="space-y-1">
                <label className="block text-sm font-medium text-slate-700">{t('common.phone')}</label>
                <input type="tel" className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20" required />
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody className="p-6 space-y-4">
            <h2 className="text-lg font-semibold text-slate-900">{t('cart.stepDelivery')}</h2>
            <div className="space-y-1">
              <label className="block text-sm font-medium text-slate-700">{t('common.address')}</label>
              <input type="text" className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20" required />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block text-sm font-medium text-slate-700">{t('common.city')}</label>
                <input type="text" className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20" required />
              </div>
              <div className="space-y-1">
                <label className="block text-sm font-medium text-slate-700">{t('common.address')} 2</label>
                <input type="text" className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20" required />
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="p-6 space-y-4">
            <h2 className="text-lg font-semibold text-slate-900">{t('cart.stepPayment')}</h2>
            <div className="space-y-1">
              <label className="block text-sm font-medium text-slate-700">{t('payments.method')}</label>
              <select className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20">
                <option value="cash">{t('payments.cash')}</option>
                <option value="card">{t('payments.card')}</option>
                <option value="bank_transfer">{t('payments.bankTransfer')}</option>
              </select>
            </div>
          </CardBody>
        </Card>
      </div>

      <div className="mt-8">
        <Card>
          <CardBody className="p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">{t('cart.title')}</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500 dark:text-slate-400">{t('cart.subtotal')}</span>
                <span className="font-medium">{total.toLocaleString()} TND</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500 dark:text-slate-400">{t('cart.delivery')}</span>
                <span className="font-medium">{t('cart.freeDelivery')}</span>
              </div>
              <div className="border-t border-base pt-3 flex items-center justify-between">
                <span className="text-base font-semibold">{t('cart.total')}</span>
                <span className="text-lg font-bold text-primary">{grandTotal.toLocaleString()} TND</span>
              </div>
            </div>
            <Button type="submit" className="w-full mt-4" size="lg">
              {t('cart.checkout')}
            </Button>
          </CardBody>
        </Card>
      </div>
    </form>
  </div>
)
}