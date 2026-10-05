import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ShieldCheck, ShoppingCart, Truck } from 'lucide-react'

import { Badge, Button, PriceBlock, QuantityStepper, Rating, StockBadge, Tabs } from '@/components/common'
import { Alert, ErrorState, ProductDetailSkeleton } from '@/components/common/Feedback'
import { ProductGrid, WishlistButton, primaryImageOf } from '@/components/product/ProductCard'
import { ProductGallery } from '@/components/product/ProductGallery'
import { Breadcrumbs, Container, Section, SectionHeading } from '@/components/layout/Primitives'
import { useAuth } from '@/hooks/useAuth'
import { useCartMutations } from '@/hooks/useCart'
import { useProduct, useRelatedProducts } from '@/hooks/useProducts'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { toast } from '@/store/uiStore'
import { ROUTES } from '@/utils/constants'

export default function ProductDetailPage() {
  const { productId } = useParams<{ productId: string }>()
  const { data: product, isLoading, isError, error, refetch } = useProduct(productId)
  const { data: related } = useRelatedProducts(product?.id, product?.category?.id)
  const [quantity, setQuantity] = useState(1)
  const [tab, setTab] = useState('description')

  useDocumentTitle(product ? `${product.name} — StartStore` : 'Product — StartStore')

  // Reset the quantity whenever the product changes.
  useEffect(() => setQuantity(1), [product?.id])

  const specs = useMemo(() => buildSpecs(product), [product])

  if (isLoading) {
    return (
      <Section className="pt-10">
        <Container>
          <ProductDetailSkeleton />
        </Container>
      </Section>
    )
  }

  if (isError || !product) {
    return (
      <Section className="pt-16">
        <Container size="narrow">
          <ErrorState
            title="Product unavailable"
            message={
              error instanceof Error
                ? error.message
                : 'This product may have been archived or the link is wrong.'
            }
            onRetry={() => void refetch()}
          />
          <div className="mt-6 text-center">
            <Button variant="outline" onClick={() => window.history.back()}>
              Go back
            </Button>
          </div>
        </Container>
      </Section>
    )
  }

  const maxQuantity = Math.max(1, product.stock)

  return (
    <>
      <Section className="pb-8 pt-6 sm:pt-8">
        <Container>
          <Breadcrumbs
            className="mb-6"
            items={[
              { label: 'Home', to: ROUTES.home },
              { label: 'Shop', to: ROUTES.products },
              ...(product.category
                ? [{ label: product.category.name, to: `${ROUTES.products}?category=${product.category.slug}` }]
                : []),
              { label: product.name },
            ]}
          />

          <div className="grid gap-10 lg:grid-cols-2 lg:gap-14">
            <ProductGallery
              productName={product.name}
              primaryUrl={primaryImageOf(product)}
              images={product.images}
            />

            <div className="lg:pt-4">
              <div className="flex flex-wrap items-center gap-2">
                {product.category && (
                  <Link to={`${ROUTES.products}?category=${product.category.slug}`}>
                    <Badge variant="neutral">{product.category.name}</Badge>
                  </Link>
                )}
                {product.is_on_sale && product.discount_percentage > 0 && (
                  <Badge variant="danger">Save {product.discount_percentage}%</Badge>
                )}
                {!product.is_active && <Badge variant="warning">Archived</Badge>}
              </div>

              <h1 className="mt-3 text-2xl font-semibold leading-tight tracking-tight text-ink sm:text-3xl">
                {product.name}
              </h1>

              <div className="mt-2.5 flex flex-wrap items-center gap-3">
                <Rating value={4.5} count={128} />
                {product.sku && <span className="text-xs text-ink-faint">SKU {product.sku}</span>}
              </div>

              <div className="mt-6">
                <PriceBlock
                  price={product.price}
                  discountPrice={product.discount_price}
                  finalPrice={product.final_price}
                  discountPercentage={product.discount_percentage}
                  size="lg"
                />
                <p className="mt-1 text-xs text-ink-muted">
                  Price includes all taxes. Delivered in 2–4 working days.
                </p>
              </div>

              <div className="mt-5">
                <StockBadge stock={product.stock} threshold={5} />
              </div>

              {!product.in_stock && (
                <Alert variant="warning" className="mt-5">
                  This item is out of stock. Save it to your wishlist and we will let you
                  know when it returns.
                </Alert>
              )}

              {product.in_stock && (
                <div className="mt-7 space-y-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <QuantityStepper
                      value={quantity}
                      min={1}
                      max={maxQuantity}
                      onChange={setQuantity}
                    />
                    <span className="text-xs text-ink-muted">
                      {maxQuantity} available
                    </span>
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row">
                    <AddToCartButton
                      productId={product.id}
                      quantity={quantity}
                      variant="outline"
                      className="sm:flex-1"
                    />
                    <BuyNowButton productId={product.id} quantity={quantity} className="sm:flex-1" />
                  </div>

                  <div className="flex items-center gap-3 pt-1">
                    <WishlistButton productId={product.id} />
                    <span className="text-sm text-ink-soft">Save for later</span>
                  </div>
                </div>
              )}

              <ul className="mt-7 space-y-2.5 border-t border-zinc-100 pt-6 text-sm text-ink-muted">
                <li className="flex items-center gap-2.5">
                  <Truck className="h-4 w-4 shrink-0 text-ink-faint" aria-hidden />
                  Free delivery on orders over $100
                </li>
                <li className="flex items-center gap-2.5">
                  <ShieldCheck className="h-4 w-4 shrink-0 text-ink-faint" aria-hidden />
                  30-day returns, prepaid label included
                </li>
              </ul>
            </div>
          </div>
        </Container>
      </Section>

      <Section className="border-t border-zinc-100">
        <Container>
          <div className="mx-auto max-w-3xl">
            <Tabs
              tabs={[
                { id: 'description', label: 'Description' },
                { id: 'specifications', label: 'Specifications' },
              ]}
              active={tab}
              onChange={setTab}
              className="mb-6"
            />

            {tab === 'description' ? (
              <div className="animate-fade-in">
                {product.description ? (
                  <p className="whitespace-pre-line text-[0.9375rem] leading-relaxed text-ink-soft">
                    {product.description}
                  </p>
                ) : (
                  <p className="text-[0.9375rem] text-ink-muted">
                    No description has been published for this product yet.
                  </p>
                )}
              </div>
            ) : (
              <dl className="animate-fade-in divide-y divide-zinc-100">
                {specs.map((spec) => (
                  <div key={spec.label} className="flex gap-4 py-3">
                    <dt className="w-40 shrink-0 text-sm text-ink-muted">{spec.label}</dt>
                    <dd className="min-w-0 flex-1 text-sm font-medium text-ink">{spec.value}</dd>
                  </div>
                ))}
              </dl>
            )}
          </div>
        </Container>
      </Section>

      {related && related.length > 0 && (
        <Section className="border-t border-zinc-100 bg-surface">
          <Container>
            <SectionHeading
              eyebrow="You might also like"
              title="Related products"
              description={`More from ${product.category?.name ?? 'the catalogue'}.`}
            />
            <ProductGrid products={related} />
          </Container>
        </Section>
      )}
    </>
  )
}

/* -------------------------------------------------------------------------- */
/* Actions                                                                      */
/* -------------------------------------------------------------------------- */

function AddToCartButton({
  productId,
  quantity,
  variant = 'primary',
  className,
}: {
  productId: string
  quantity: number
  variant?: 'primary' | 'outline'
  className?: string
}) {
  const { addItem, addPending } = useCartMutations()
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()

  return (
    <Button
      variant={variant}
      size="lg"
      fullWidth
      className={className}
      leftIcon={<ShoppingCart className="h-4 w-4" />}
      isLoading={addPending}
      loadingText="Adding…"
      onClick={async () => {
        if (!isAuthenticated) {
          toast.info('Sign in to add to your bag', 'Your bag is tied to your account.')
          navigate(ROUTES.login, { state: { from: ROUTES.product(productId) } })
          return
        }
        await addItem({ product_id: productId, quantity })
      }}
    >
      Add to bag
    </Button>
  )
}

function BuyNowButton({
  productId,
  quantity,
  className,
}: {
  productId: string
  quantity: number
  className?: string
}) {
  const { addItem, addPending } = useCartMutations()
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()

  return (
    <Button
      size="lg"
      fullWidth
      className={className}
      isLoading={addPending}
      onClick={async () => {
        if (!isAuthenticated) {
          toast.info('Sign in to continue', 'Checkout needs an account.')
          navigate(ROUTES.login, { state: { from: ROUTES.product(productId) } })
          return
        }
        await addItem({ product_id: productId, quantity })
        navigate(ROUTES.checkout)
      }}
    >
      Buy now
    </Button>
  )
}

/* -------------------------------------------------------------------------- */
/* Specs                                                                        */
/* -------------------------------------------------------------------------- */

function buildSpecs(product: {
  sku: string | null
  stock: number
  category: { name: string } | null
  created_at: string
  discount_price: string | null
} | null | undefined) {
  if (!product) return []
  return [
    { label: 'SKU', value: product.sku || '—' },
    { label: 'Category', value: product.category?.name ?? 'Uncategorised' },
    { label: 'Availability', value: product.stock > 0 ? `${product.stock} in stock` : 'Out of stock' },
    { label: 'On sale', value: product.discount_price ? 'Yes' : 'No' },
    {
      label: 'Added',
      value: new Date(product.created_at).toLocaleDateString('en-US', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }),
    },
  ]
}
