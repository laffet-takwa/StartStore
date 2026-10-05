import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Check, CreditCard, Lock, MapPin, Package, Truck } from 'lucide-react'

import { useMutation, useQueryClient } from '@tanstack/react-query'

import { Alert, Button, RadioGroup } from '@/components/common'
import { Price } from '@/components/common/Display'
import { AddressForm } from '@/components/checkout/AddressForm'
import { CheckoutProgressBar, CheckoutSteps } from '@/components/checkout/CheckoutSteps'
import { Container } from '@/components/layout/Primitives'
import { ProductImage, primaryImageOf } from '@/components/product/ProductCard'
import { useCart } from '@/hooks/useCart'
import { useCheckout } from '@/hooks/useOrders'
import { useDefaultAddress, useAddresses } from '@/hooks/useUser'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { useAuth } from '@/hooks/useAuth'
import { addressService } from '@/services/address.service'
import { toast } from '@/store/uiStore'
import { queryKeys } from '@/lib/queryClient'
import type { Address, CheckoutPaymentMethod } from '@/types'
import { ROUTES } from '@/utils/constants'

const STEPS = [
  { id: 'information', label: 'Information' },
  { id: 'address', label: 'Address' },
  { id: 'review', label: 'Review' },
  { id: 'payment', label: 'Payment' },
]

const PAYMENT_METHODS = [
  {
    value: 'card' as const,
    label: 'Card',
    description: 'Visa, Mastercard and American Express.',
  },
  {
    value: 'pay_on_delivery' as const,
    label: 'Pay on delivery',
    description: 'Settle when your parcel arrives. Available nationwide.',
  },
]

export default function CheckoutPage() {
  useDocumentTitle('Checkout — StartStore')

  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { cart, items, isLoading: cartLoading, isError: cartError } = useCart()
  const { user } = useAuth()
  const { data: addressData } = useAddresses()
  const defaultAddress = useDefaultAddress()
  const checkout = useCheckout()

  const addresses = addressData?.results ?? []
  const [step, setStep] = useState(1)
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null)
  const [showAddressForm, setShowAddressForm] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<CheckoutPaymentMethod>('card')

  // Preselect the default address once addresses arrive.
  useEffect(() => {
    if (selectedAddressId || !defaultAddress) return
    setSelectedAddressId(defaultAddress.id)
  }, [defaultAddress, selectedAddressId])

  const selectedAddress = useMemo(
    () => addresses.find((entry) => entry.id === selectedAddressId) ?? null,
    [addresses, selectedAddressId],
  )

  const createAddress = useMutation({
    mutationFn: addressService.create,
    onSuccess: (address) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.addresses })
      setSelectedAddressId(address.id)
      setShowAddressForm(false)
      toast.success('Address saved')
    },
    onError: (error) =>
      toast.error('Could not save the address', error instanceof Error ? error.message : undefined),
  })

  // Nothing to check out with: send the customer back to the catalogue.
  useEffect(() => {
    if (!cartLoading && items.length === 0) navigate(ROUTES.cart, { replace: true })
  }, [cartLoading, items.length, navigate])

  const hasUnavailableItems = items.some((item) => !item.is_available)
  const contactName = user?.full_name?.trim() || selectedAddress?.full_name?.trim() || ''

  const placeOrder = async () => {
    if (!selectedAddressId) return
    try {
      // Only the destination and the payment preference are sent; Django
      // recalculates every price and decrements stock itself.
      const order = await checkout.mutateAsync({
        shipping_address_id: selectedAddressId,
        payment_method: paymentMethod,
      })
      navigate(ROUTES.orderSuccess(order.id), { replace: true })
    } catch {
      toast.error('Could not place the order', 'Review your bag and try again.')
    }
  }

  if (cartLoading) {
    return (
      <Container className="py-16">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-zinc-100" />
      </Container>
    )
  }

  if (cartError || !cart) {
    return (
      <Container className="py-16">
        <Alert variant="danger" title="We could not load your bag">
          Please refresh the page and try again.
        </Alert>
      </Container>
    )
  }

  return (
    <div className="py-8 sm:py-12">
      <Container>
        <h1 className="text-2xl font-semibold tracking-tight text-ink sm:text-3xl">Checkout</h1>

        <div className="mt-8 hidden sm:block">
          <CheckoutSteps current={step} steps={STEPS} />
        </div>
        <div className="mt-6 sm:hidden">
          <CheckoutProgressBar current={step} total={STEPS.length} />
        </div>

        <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_360px] lg:gap-10">
          <div className="min-w-0">
            {hasUnavailableItems && (
              <Alert variant="warning" className="mb-6">
                Some items in your bag are unavailable. Remove or adjust them before
                placing the order.
              </Alert>
            )}

            {/* --- Step 1: information --- */}
            {step === 1 && (
              <StepPanel
                icon={<Package className="h-4 w-4" aria-hidden />}
                title="Contact information"
                description="We will use these details for order updates."
              >
                <dl className="divide-y divide-zinc-100">
                  <Row label="Email" value={user?.email ?? '—'} />
                  <Row
                    label="Name"
                    value={contactName || 'Add a name in your address book'}
                  />
                  <Row label="Phone" value={user?.phone || selectedAddress?.phone || '—'} />
                </dl>
                <div className="mt-5">
                  <Button onClick={() => setStep(2)} disabled={items.length === 0}>
                    Continue to address
                  </Button>
                </div>
              </StepPanel>
            )}

            {/* --- Step 2: address --- */}
            {step === 2 && (
              <StepPanel
                icon={<MapPin className="h-4 w-4" aria-hidden />}
                title="Shipping address"
                description="Choose a saved address or add a new one."
              >
                {addresses.length > 0 ? (
                  <div className="space-y-2.5">
                    {addresses.map((address) => (
                      <AddressOption
                        key={address.id}
                        address={address}
                        selected={address.id === selectedAddressId}
                        onSelect={() => setSelectedAddressId(address.id)}
                      />
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-ink-muted">
                    You have no saved addresses yet. Add one to continue.
                  </p>
                )}

                {showAddressForm ? (
                  <div className="mt-5 rounded-2xl border border-zinc-200 bg-surface p-5">
                    <AddressForm
                      onSubmit={(values) => {
                        void createAddress.mutateAsync({
                          ...values,
                          full_name: contactName || undefined,
                        })
                      }}
                      onCancel={() => setShowAddressForm(false)}
                      isSubmitting={createAddress.isPending}
                      submitLabel="Save and use"
                    />
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => setShowAddressForm(true)}
                  >
                    Add a new address
                  </Button>
                )}

                <div className="mt-6 flex flex-wrap gap-3">
                  <Button variant="ghost" onClick={() => setStep(1)}>
                    Back
                  </Button>
                  <Button onClick={() => setStep(3)} disabled={!selectedAddress}>
                    Continue to review
                  </Button>
                </div>
              </StepPanel>
            )}

            {/* --- Step 3: review --- */}
            {step === 3 && (
              <StepPanel
                icon={<Check className="h-4 w-4" aria-hidden />}
                title="Review your order"
                description="Confirm the items and totals before payment."
              >
                <ul className="divide-y divide-zinc-100">
                  {items.map((item) => (
                    <li key={item.id} className="flex items-center gap-4 py-4 first:pt-0">
                      <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-zinc-200">
                        <ProductImage
                          src={primaryImageOf(item.product)}
                          alt={item.product.name}
                          ratio="aspect-square"
                          className="h-full w-full"
                          sizes="64px"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="line-clamp-1 text-sm font-medium text-ink">
                          {item.product.name}
                        </p>
                        <p className="mt-0.5 text-xs text-ink-muted">
                          Quantity {item.quantity} × <Price value={item.unit_price} />
                        </p>
                      </div>
                      <p className="shrink-0 text-sm font-semibold text-ink">
                        <Price value={item.line_total} />
                      </p>
                    </li>
                  ))}
                </ul>

                {selectedAddress && (
                  <div className="mt-5 rounded-xl bg-surface px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
                      Delivering to
                    </p>
                    <p className="mt-1.5 text-sm text-ink-soft">
                      {selectedAddress.full_name}
                      <br />
                      {selectedAddress.address_line}
                      <br />
                      {[selectedAddress.city, selectedAddress.postal_code, selectedAddress.country]
                        .filter(Boolean)
                        .join(', ')}
                    </p>
                  </div>
                )}

                <div className="mt-6 flex flex-wrap gap-3">
                  <Button variant="ghost" onClick={() => setStep(2)}>
                    Back
                  </Button>
                  <Button onClick={() => setStep(4)} disabled={!selectedAddress}>
                    Continue to payment
                  </Button>
                </div>
              </StepPanel>
            )}

            {/* --- Step 4: payment --- */}
            {step === 4 && (
              <StepPanel
                icon={<CreditCard className="h-4 w-4" aria-hidden />}
                title="Payment"
                description="Choose how you would like to pay."
              >
                <RadioGroup
                  options={PAYMENT_METHODS}
                  value={paymentMethod}
                  onChange={setPaymentMethod}
                />

                <Alert variant="info" className="mt-4">
                  <span className="inline-flex items-center gap-1.5">
                    <Lock className="h-3.5 w-3.5" aria-hidden />
                    This MVP does not collect card details. Your order is recorded as
                    awaiting payment and a staff member completes the transaction.
                  </span>
                </Alert>

                <div className="mt-6 flex flex-wrap gap-3">
                  <Button variant="ghost" onClick={() => setStep(3)}>
                    Back
                  </Button>
                  <Button
                    size="lg"
                    isLoading={checkout.isPending}
                    loadingText="Placing order…"
                    disabled={hasUnavailableItems || !selectedAddress}
                    onClick={() => void placeOrder()}
                  >
                    Place order · <Price value={cart.total} />
                  </Button>
                </div>
              </StepPanel>
            )}
          </div>

          {/* --- Order summary rail --- */}
          <aside className="lg:sticky lg:top-28 lg:self-start">
            <div className="rounded-2xl border border-zinc-200 bg-white shadow-card">
              <div className="border-b border-zinc-100 px-5 py-4">
                <h2 className="text-base font-semibold tracking-tight text-ink">
                  Order summary
                </h2>
              </div>

              <dl className="space-y-3 px-5 py-5 text-sm">
                <div className="flex justify-between">
                  <dt className="text-ink-muted">Subtotal</dt>
                  <dd className="font-medium text-ink">
                    <Price value={cart.subtotal} />
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-ink-muted">Shipping</dt>
                  <dd className="font-medium text-ink">
                    {Number(cart.shipping_cost) === 0 ? (
                      <span className="text-emerald-600">Free</span>
                    ) : (
                      <Price value={cart.shipping_cost} />
                    )}
                  </dd>
                </div>
                <div className="flex justify-between border-t border-zinc-100 pt-3">
                  <dt className="font-medium text-ink">Total</dt>
                  <dd className="text-lg font-semibold text-ink">
                    <Price value={cart.total} />
                  </dd>
                </div>
              </dl>

              <div className="space-y-2 border-t border-zinc-100 px-5 py-4">
                <p className="flex items-center gap-2 text-2xs text-ink-muted">
                  <Truck className="h-3.5 w-3.5" aria-hidden />
                  Dispatched within 2 working days
                </p>
                <p className="flex items-center gap-2 text-2xs text-ink-muted">
                  <Lock className="h-3.5 w-3.5" aria-hidden />
                  Totals are confirmed by the server at checkout
                </p>
              </div>
            </div>
          </aside>
        </div>
      </Container>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* Pieces                                                                       */
/* -------------------------------------------------------------------------- */

function StepPanel({
  icon,
  title,
  description,
  children,
}: {
  icon: React.ReactNode
  title: string
  description: string
  children: React.ReactNode
}) {
  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-card sm:p-7">
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
          {icon}
        </span>
        <div>
          <h2 className="text-base font-semibold tracking-tight text-ink">{title}</h2>
          <p className="mt-0.5 text-sm text-ink-muted">{description}</p>
        </div>
      </div>
      <div className="mt-6">{children}</div>
    </section>
  )
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-3 first:pt-0 last:pb-0">
      <dt className="text-sm text-ink-muted">{label}</dt>
      <dd className="text-sm font-medium text-ink">{value}</dd>
    </div>
  )
}

function AddressOption({
  address,
  selected,
  onSelect,
}: {
  address: Address
  selected: boolean
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={`flex w-full items-start gap-3 rounded-xl border px-4 py-3 text-left transition-all duration-150 ${
        selected
          ? 'border-brand-500 bg-brand-50/60 ring-1 ring-brand-500'
          : 'border-zinc-300 bg-white hover:border-zinc-400 hover:bg-zinc-50'
      }`}
    >
      <span
        className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 ${
          selected ? 'border-brand-600' : 'border-zinc-300'
        }`}
      >
        {selected && <span className="h-2 w-2 rounded-full bg-brand-600" />}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium text-ink">
          {address.full_name || 'Address'}
          {address.is_default && (
            <span className="ml-2 text-2xs font-medium uppercase tracking-wide text-brand-600">
              Default
            </span>
          )}
        </span>
        <span className="mt-0.5 block text-sm text-ink-muted">{address.address_line}</span>
        <span className="block text-sm text-ink-muted">
          {[address.city, address.postal_code, address.country].filter(Boolean).join(', ')}
        </span>
      </span>
    </button>
  )
}
