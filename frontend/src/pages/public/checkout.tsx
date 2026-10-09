import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, ChevronRight, ChevronLeft } from 'lucide-react'
import { Card, CardBody, Button } from '@/components/ui'
import { cn } from '@/utils/cn'
import { useCart } from '@/context/cart-context'
import { useI18n } from '@/i18n/context'

type CheckoutStep = 'information' | 'delivery' | 'payment' | 'confirmation'

export default function CheckoutPage() {
  const { items, total, clearCart } = useCart()
  const { t } = useI18n()
  const [submitted, setSubmitted] = useState(false)
  const [step, setStep] = useState<CheckoutStep>('information')
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    address2: '',
    paymentMethod: 'cash',
  })

  const tax = total * 0.19
  const grandTotal = total + tax

  const steps: { key: CheckoutStep; labelKey: string }[] = [
    { key: 'information', labelKey: 'cart.stepInfo' },
    { key: 'delivery', labelKey: 'cart.stepDelivery' },
    { key: 'payment', labelKey: 'cart.stepPayment' },
    { key: 'confirmation', labelKey: 'cart.stepConfirmation' },
  ]

  const currentStepIndex = steps.findIndex((s) => s.key === step)

  const handleNext = () => {
    if (step === 'information') setStep('delivery')
    else if (step === 'delivery') setStep('payment')
    else if (step === 'payment') {
      setStep('confirmation')
      setSubmitted(true)
      clearCart()
    }
  }

  const handleBack = () => {
    if (step === 'delivery') setStep('information')
    else if (step === 'payment') setStep('delivery')
  }

  const updateField = (field: string, value: string) => {
    setForm((f) => ({ ...f, [field]: value }))
  }

  if (submitted) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center"
      >
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
      </motion.div>
    )
  }

  if (items.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center"
      >
        <h1 className="text-2xl font-bold text-slate-900 mb-2">{t('cart.emptyTitle')}</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">{t('cart.emptyDescription')}</p>
        <Link to="/shop">
          <Button>{t('shop.title')}</Button>
        </Link>
      </motion.div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 mb-1">{t('cart.checkoutTitle')}</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">Complete your order in {steps.length} steps</p>
      </div>

      {/* Stepper */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {steps.map((s, i) => (
            <div key={s.key} className="flex items-center gap-3 flex-1">
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    'h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors',
                    i < currentStepIndex
                      ? 'bg-success text-white'
                      : i === currentStepIndex
                        ? 'bg-primary text-white'
                        : 'bg-slate-100 text-slate-400 dark:bg-slate-800'
                  )}
                >
                  {i < currentStepIndex ? <CheckCircle className="h-4 w-4" /> : i + 1}
                </div>
                <span
                  className={cn(
                    'text-sm font-medium hidden sm:block',
                    i <= currentStepIndex ? 'text-slate-900 dark:text-slate-100' : 'text-slate-400'
                  )}
                >
                  {t(s.labelKey)}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div className="hidden sm:block flex-1 h-px mx-2 bg-slate-200 dark:bg-slate-700">
                  <div
                    className="h-full bg-primary transition-all duration-300"
                    style={{ width: i < currentStepIndex ? '100%' : '0%' }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <AnimatePresence mode="wait">
            {step === 'information' && (
              <motion.div
                key="information"
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.2 }}
              >
                <Card>
                  <CardBody className="p-6 space-y-4">
                    <h2 className="text-lg font-semibold text-slate-900">{t('common.name')}</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="block text-sm font-medium text-slate-700">{t('auth.firstName')}</label>
                        <input
                          type="text"
                          value={form.firstName}
                          onChange={(e) => updateField('firstName', e.target.value)}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                          required
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="block text-sm font-medium text-slate-700">{t('auth.lastName')}</label>
                        <input
                          type="text"
                          value={form.lastName}
                          onChange={(e) => updateField('lastName', e.target.value)}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="block text-sm font-medium text-slate-700">{t('auth.email')}</label>
                      <input
                        type="email"
                        value={form.email}
                        onChange={(e) => updateField('email', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-sm font-medium text-slate-700">{t('common.phone')}</label>
                      <input
                        type="tel"
                        value={form.phone}
                        onChange={(e) => updateField('phone', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                        required
                      />
                    </div>
                    <div className="flex justify-end pt-2">
                      <Button onClick={handleNext} icon={<ChevronRight className="h-4 w-4" />}>
                        {t('common.next')}
                      </Button>
                    </div>
                  </CardBody>
                </Card>
              </motion.div>
            )}

            {step === 'delivery' && (
              <motion.div
                key="delivery"
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.2 }}
              >
                <Card>
                  <CardBody className="p-6 space-y-4">
                    <h2 className="text-lg font-semibold text-slate-900">{t('cart.stepDelivery')}</h2>
                    <div className="space-y-1">
                      <label className="block text-sm font-medium text-slate-700">{t('common.address')}</label>
                      <input
                        type="text"
                        value={form.address}
                        onChange={(e) => updateField('address', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                        required
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="block text-sm font-medium text-slate-700">{t('common.city')}</label>
                        <input
                          type="text"
                          value={form.city}
                          onChange={(e) => updateField('city', e.target.value)}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                          required
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="block text-sm font-medium text-slate-700">{t('common.address')} 2</label>
                        <input
                          type="text"
                          value={form.address2}
                          onChange={(e) => updateField('address2', e.target.value)}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                        />
                      </div>
                    </div>
                    <div className="flex justify-between pt-2">
                      <Button variant="outline" onClick={handleBack} icon={<ChevronLeft className="h-4 w-4" />}>
                        {t('common.back')}
                      </Button>
                      <Button onClick={handleNext} icon={<ChevronRight className="h-4 w-4" />}>
                        {t('common.next')}
                      </Button>
                    </div>
                  </CardBody>
                </Card>
              </motion.div>
            )}

            {step === 'payment' && (
              <motion.div
                key="payment"
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.2 }}
              >
                <Card>
                  <CardBody className="p-6 space-y-4">
                    <h2 className="text-lg font-semibold text-slate-900">{t('cart.stepPayment')}</h2>
                    <div className="space-y-1">
                      <label className="block text-sm font-medium text-slate-700">{t('payments.method')}</label>
                      <select
                        value={form.paymentMethod}
                        onChange={(e) => updateField('paymentMethod', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                      >
                        <option value="cash">{t('payments.cash')}</option>
                        <option value="card">{t('payments.card')}</option>
                        <option value="bank_transfer">{t('payments.bankTransfer')}</option>
                      </select>
                    </div>
                    <div className="flex justify-between pt-2">
                      <Button variant="outline" onClick={handleBack} icon={<ChevronLeft className="h-4 w-4" />}>
                        {t('common.back')}
                      </Button>
                      <Button onClick={handleNext}>{t('common.confirm')}</Button>
                    </div>
                  </CardBody>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div>
          <Card className="sticky top-24">
            <CardBody className="p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">{t('cart.title')}</h2>
              <div className="space-y-3 mb-4">
                {items.map((item) => (
                  <div key={item.product.id} className="flex items-center justify-between text-sm">
                    <span className="text-slate-600 dark:text-slate-300 truncate flex-1 mr-4">{item.product.name}</span>
                    <span className="font-medium whitespace-nowrap">{item.product.selling_price.toLocaleString()} TND</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-base pt-3 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500 dark:text-slate-400">{t('cart.subtotal')}</span>
                  <span className="font-medium">{total.toLocaleString()} TND</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500 dark:text-slate-400">{t('cart.delivery')}</span>
                  <span className="font-medium">{t('cart.freeDelivery')}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500 dark:text-slate-400">{t('common.tax')}</span>
                  <span className="font-medium">{tax.toLocaleString()} TND</span>
                </div>
                <div className="border-t border-base pt-2 flex items-center justify-between">
                  <span className="text-base font-semibold">{t('cart.total')}</span>
                  <span className="text-lg font-bold text-primary">{grandTotal.toLocaleString()} TND</span>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  )
}
