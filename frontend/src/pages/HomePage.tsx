import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  PackageSearch,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Truck,
  Wallet,
  Zap,
} from 'lucide-react'

import { Badge, Button, ButtonLink } from '@/components/common'
import { Alert, EmptyState } from '@/components/common/Feedback'
import { CategoryCard } from '@/components/product/CategoryCard'
import { ProductGrid, ProductImage, primaryImageOf } from '@/components/product/ProductCard'
import { Container, Panel, Section, SectionHeading } from '@/components/layout/Primitives'
import { useCategories, useProducts } from '@/hooks/useProducts'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { newsletterService } from '@/services/newsletter.service'
import { cn } from '@/lib/cn'
import type { Product } from '@/types'
import { formatMoney } from '@/utils/format'
import { ROUTES } from '@/utils/constants'

export default function HomePage() {
  useDocumentTitle('StartStore — Curated essentials for modern life')

  return (
    <>
      <Hero />
      <PopularCategories />
      <FeaturedProducts />
      <PromoBanner />
      <OnSale />
      <NewArrivals />
      <Benefits />
      <Newsletter />
    </>
  )
}

/* -------------------------------------------------------------------------- */
/* Hero                                                                         */
/* -------------------------------------------------------------------------- */

function Hero() {
  const { data, isLoading } = useProducts({ ordering: '-created_at', page_size: 3 })

  return (
    <section className="relative overflow-hidden border-b border-zinc-100">
      {/* Soft brand wash behind the copy. */}
      <div
        className="pointer-events-none absolute -right-32 -top-40 h-[32rem] w-[32rem] rounded-full bg-brand-100/60 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -left-40 top-40 h-96 w-96 rounded-full bg-amber-100/40 blur-3xl"
        aria-hidden
      />

      <Container size="wide">
        <div className="relative grid items-center gap-12 py-14 lg:grid-cols-2 lg:gap-16 lg:py-24">
          <div className="max-w-xl animate-slide-up">
            <Badge variant="brand" className="mb-5">
              <Sparkles className="h-3 w-3" aria-hidden />
              New season, better essentials
            </Badge>

            <h1 className="text-balance text-4xl font-semibold leading-[1.08] tracking-tight text-ink sm:text-5xl lg:text-[3.5rem]">
              Fewer, better things for everyday life.
            </h1>

            <p className="mt-5 max-w-lg text-base leading-relaxed text-ink-soft sm:text-lg">
              We curate electronics, home and apparel down to the pieces worth owning —
              then deliver them fast, with returns handled in thirty days.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <ButtonLink to={ROUTES.products} size="lg" rightIcon={<ArrowRight className="h-4 w-4" />}>
                Shop the catalogue
              </ButtonLink>
              <ButtonLink to={ROUTES.categories} variant="outline" size="lg">
                Browse categories
              </ButtonLink>
            </div>

            <dl className="mt-10 grid max-w-md grid-cols-3 gap-4">
              {[
                { value: '30', label: 'day returns' },
                { value: '4.9', label: 'avg. rating' },
                { value: '48h', label: 'delivery' },
              ].map((stat) => (
                <div key={stat.label}>
                  <dt className="text-xl font-semibold tracking-tight text-ink">{stat.value}</dt>
                  <dd className="mt-0.5 text-2xs uppercase tracking-wide text-ink-muted">
                    {stat.label}
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Product collage. */}
          <div className="relative animate-slide-up">
            {isLoading ? (
              <div className="aspect-square animate-pulse rounded-3xl bg-zinc-100" />
            ) : data?.results.length ? (
              <ProductCollage products={data.results} />
            ) : (
              <div className="flex aspect-square items-center justify-center rounded-3xl bg-surface">
                <PackageSearch className="h-10 w-10 text-zinc-300" aria-hidden />
              </div>
            )}
          </div>
        </div>
      </Container>
    </section>
  )
}

function ProductCollage({ products }: { products: Product[] }) {
  const [lead, ...rest] = products
  const side = rest.slice(0, 2)

  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4">
      {/* Lead product: portrait on the left. */}
      <Link
        to={ROUTES.product(lead.id)}
        className="group row-span-2 overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-card-hover"
      >
        <ProductImage
          src={primaryImageOf(lead)}
          alt={lead.name}
          ratio="aspect-[3/4]"
          sizes="(max-width: 1024px) 55vw, 26vw"
          className="h-full w-full object-cover transition-transform duration-700 ease-spring group-hover:scale-105"
        />
      </Link>

      {/* Secondary products, top and bottom. */}
      <div className="flex flex-col gap-3 sm:gap-4">
        {side.map((product, index) => (
          <Link
            key={product.id}
            to={ROUTES.product(product.id)}
            className={cn(
              'group relative flex-1 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-card',
              // With a single secondary product, let it fill the column.
              side.length === 1 && 'flex-none',
            )}
          >
            <ProductImage
              src={primaryImageOf(product)}
              alt={product.name}
              ratio={side.length === 1 ? 'aspect-[4/3]' : 'aspect-[16/9]'}
              sizes="(max-width: 1024px) 45vw, 22vw"
              className="h-full w-full object-cover transition-transform duration-700 ease-spring group-hover:scale-105"
            />
            <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink/60 via-transparent to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
            <span className="pointer-events-none absolute inset-x-0 bottom-0 line-clamp-2 p-3 text-xs font-medium text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100">
              {product.name}
            </span>
            {index === 0 && product.is_on_sale && product.discount_percentage > 0 && (
              <span className="absolute left-2.5 top-2.5">
                <Badge variant="danger">−{product.discount_percentage}%</Badge>
              </span>
            )}
          </Link>
        ))}

        {/* Filler tile keeps the collage balanced when few products exist. */}
        {side.length < 2 && (
          <div className="flex flex-1 flex-col justify-center rounded-2xl bg-gradient-to-br from-brand-600 to-brand-800 p-5 text-white">
            <Zap className="h-5 w-5" aria-hidden />
            <p className="mt-3 text-sm font-semibold leading-snug">New drops every week</p>
            <p className="mt-1 text-2xs text-white/70">Fresh picks, restocked daily.</p>
          </div>
        )}
      </div>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* Categories                                                                   */
/* -------------------------------------------------------------------------- */

function PopularCategories() {
  const { data, isLoading, isError, error, refetch } = useCategories()

  return (
    <Section>
      <Container>
        <SectionHeading
          eyebrow="Browse"
          title="Shop by category"
          description="Fourteen-day delivery on everything, or pick up from a collection below."
          action={<ButtonLink to={ROUTES.categories} variant="ghost" rightIcon={<ArrowRight className="h-4 w-4" />}>View all</ButtonLink>}
        />

        {isLoading && (
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="aspect-[4/5] animate-pulse rounded-2xl bg-zinc-100" />
            ))}
          </div>
        )}

        {isError && (
          <Alert variant="danger" title="Categories are unavailable" action={<Button size="sm" variant="outline" onClick={() => void refetch()}>Retry</Button>}>
            {error instanceof Error ? error.message : 'Please try again.'}
          </Alert>
        )}

        {!isLoading && !isError && !data?.results.length && (
          <EmptyState
            icon={<PackageSearch className="h-5 w-5 text-ink-faint" aria-hidden />}
            title="No categories yet"
            description="Once a category is published it will appear here."
            action={<ButtonLink to={ROUTES.products}>Browse products</ButtonLink>}
          />
        )}

        {data?.results.length ? (
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {data.results.slice(0, 4).map((category) => (
              <CategoryCard key={category.id} category={category} />
            ))}
          </div>
        ) : null}
      </Container>
    </Section>
  )
}

/* -------------------------------------------------------------------------- */
/* Product rails                                                                */
/* -------------------------------------------------------------------------- */

function FeaturedProducts() {
  const { data, isLoading } = useProducts({ in_stock: true, page_size: 8 })

  return (
    <Section className="bg-surface">
      <Container>
        <SectionHeading
          eyebrow="Picked for you"
          title="Featured products"
          description="Available now and ready to ship."
          action={<ButtonLink to={ROUTES.products} variant="outline" rightIcon={<ArrowRight className="h-4 w-4" />}>Shop all</ButtonLink>}
        />
        {isLoading ? (
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="aspect-square animate-pulse rounded-2xl bg-zinc-200/60" />
            ))}
          </div>
        ) : (
          <ProductGrid products={(data?.results ?? []).slice(0, 4)} />
        )}
      </Container>
    </Section>
  )
}

function OnSale() {
  const { data, isLoading } = useProducts({ is_on_sale: true, page_size: 8 })

  // No discounted products is a normal state, not a reason to render an empty band.
  if (!isLoading && !data?.results.length) return null

  return (
    <Section>
      <Container>
        <SectionHeading
          eyebrow="Limited time"
          title="On sale now"
          description="Reduced prices while stock lasts. The API only surfaces items that are genuinely cheaper."
          action={<ButtonLink to={`${ROUTES.products}?on_sale=true`} variant="outline">See all deals</ButtonLink>}
        />
        {isLoading ? (
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="aspect-square animate-pulse rounded-2xl bg-zinc-100" />
            ))}
          </div>
        ) : (
          <ProductGrid products={(data?.results ?? []).slice(0, 4)} />
        )}
      </Container>
    </Section>
  )
}

function NewArrivals() {
  const { data, isLoading } = useProducts({ ordering: '-created_at', page_size: 8 })

  return (
    <Section className="bg-surface">
      <Container>
        <SectionHeading
          eyebrow="Just landed"
          title="New arrivals"
          description="The most recently added to the catalogue."
          action={<ButtonLink to={`${ROUTES.products}?ordering=-created_at`} variant="outline">View newest first</ButtonLink>}
        />
        {isLoading ? (
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="aspect-square animate-pulse rounded-2xl bg-zinc-200/60" />
            ))}
          </div>
        ) : (
          <ProductGrid products={(data?.results ?? []).slice(0, 4)} />
        )}
      </Container>
    </Section>
  )
}

/* -------------------------------------------------------------------------- */
/* Promo                                                                        */
/* -------------------------------------------------------------------------- */

function PromoBanner() {
  const { data } = useProducts({ is_on_sale: true, page_size: 1 })
  const deal = data?.results[0]

  return (
    <Section>
      <Container>
        <Panel className="grid items-center gap-8 p-8 sm:p-12 lg:grid-cols-2 lg:p-16">
          <div>
            <Badge variant="brand" className="mb-4">
              This week only
            </Badge>
            <h2 className="text-balance text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
              {deal ? `Up to ${deal.discount_percentage}% off ${deal.name}` : 'Seasonal pricing on selected lines'}
            </h2>
            <p className="mt-3 max-w-md text-[0.9375rem] leading-relaxed text-ink-soft">
              Discounts are applied by the server at checkout, so the price you see here is
              the price you pay. No codes, no surprises.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <ButtonLink to={ROUTES.products}>Shop the sale</ButtonLink>
              <ButtonLink to={ROUTES.categories} variant="outline">
                Browse categories
              </ButtonLink>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-sm">
            {deal ? (
              <>
                <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-card-hover">
                  <ProductImage src={primaryImageOf(deal)} alt={deal.name} ratio="aspect-square" className="w-full" />
                </div>
                {deal.price !== deal.final_price && (
                  <div className="absolute -bottom-4 -right-4 rounded-2xl bg-ink px-4 py-3 text-white shadow-float">
                    <p className="text-2xs uppercase tracking-wide text-white/60">Was</p>
                    <p className="text-sm font-semibold line-through">
                      {formatMoney(deal.price)}
                    </p>
                    <p className="mt-1 text-2xs uppercase tracking-wide text-white/60">Now</p>
                    <p className="text-lg font-semibold">{formatMoney(deal.final_price)}</p>
                  </div>
                )}
              </>
            ) : (
              <div className="aspect-square rounded-2xl bg-white/60" />
            )}
          </div>
        </Panel>
      </Container>
    </Section>
  )
}

/* -------------------------------------------------------------------------- */
/* Benefits                                                                     */
/* -------------------------------------------------------------------------- */

const BENEFITS = [
  {
    icon: Truck,
    title: 'Fast, tracked delivery',
    body: 'Free over $100 and a dispatch notice the moment your parcel leaves.',
  },
  {
    icon: RefreshCw,
    title: '30-day returns',
    body: 'Changed your mind? Send it back with a prepaid label, no questions.',
  },
  {
    icon: ShieldCheck,
    title: 'Secure by default',
    body: 'Rotating tokens and stored-only credentials keep your account protected.',
  },
  {
    icon: Wallet,
    title: 'Transparent pricing',
    body: 'Taxes and shipping are calculated on the server, so totals always match.',
  },
]

function Benefits() {
  return (
    <Section>
      <Container>
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {BENEFITS.map((benefit) => (
            <div key={benefit.title} className="text-center sm:text-left">
              <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-700 sm:mx-0">
                <benefit.icon className="h-5 w-5" aria-hidden />
              </span>
              <h3 className="mt-4 text-sm font-semibold text-ink">{benefit.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">{benefit.body}</p>
            </div>
          ))}
        </div>
      </Container>
    </Section>
  )
}

/* -------------------------------------------------------------------------- */
/* Newsletter                                                                   */
/* -------------------------------------------------------------------------- */

function Newsletter() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'sending' | 'done' | 'error'>('idle')
  const [message, setMessage] = useState('')

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    setStatus('sending')
    try {
      await newsletterService.subscribe(email)
      setStatus('done')
      setMessage('You are on the list. Welcome aboard.')
    } catch (error) {
      setStatus('error')
      setMessage(error instanceof Error ? error.message : 'Something went wrong.')
    }
  }

  return (
    <Section className="border-t border-zinc-100 bg-surface">
      <Container size="narrow">
        <div className="rounded-3xl border border-zinc-200 bg-white p-8 text-center shadow-card sm:p-12">
          <h2 className="text-2xl font-semibold tracking-tight text-ink">
            New drops, once a month
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-ink-muted">
            Occasional notes on new arrivals and the occasional reduction. No daily noise.
          </p>

          {status === 'done' ? (
            <p className="mt-6 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
              {message}
            </p>
          ) : (
            <form onSubmit={submit} className="mx-auto mt-6 flex max-w-md flex-col gap-3 sm:flex-row">
              <input
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                aria-label="Email address"
                className="h-11 flex-1 rounded-xl border border-zinc-300 px-3.5 text-sm transition-all focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              />
              <Button type="submit" isLoading={status === 'sending'} loadingText="Joining…">
                Subscribe
              </Button>
            </form>
          )}

          {status === 'error' && (
            <p className="mt-3 text-sm text-ink-muted">{message}</p>
          )}
        </div>
      </Container>
    </Section>
  )
}
