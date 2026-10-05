import { Link } from 'react-router-dom'
import { ArrowRight, PackageSearch } from 'lucide-react'

import { Button, ButtonLink } from '@/components/common'
import { Alert, EmptyState } from '@/components/common/Feedback'
import { CategoryCard } from '@/components/product/CategoryCard'
import { Container, Section } from '@/components/layout/Primitives'
import { useCategories } from '@/hooks/useProducts'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { ROUTES } from '@/utils/constants'

export default function CategoriesPage() {
  useDocumentTitle('Categories — StartStore')

  const { data, isLoading, isError, error, refetch } = useCategories()
  const categories = data?.results ?? []
  const active = categories.filter((category) => category.is_active)
  const archived = categories.filter((category) => !category.is_active)

  return (
    <Section>
      <Container>
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-brand-600">
            Catalogue
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
            Shop by category
          </h1>
          <p className="mt-3 text-[0.9375rem] leading-relaxed text-ink-muted">
            Everything we stock, grouped so you can find it quickly. Each category links
            straight into a filtered catalogue view.
          </p>
        </div>

        <div className="mt-10">
          {isLoading && (
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              {Array.from({ length: 8 }).map((_, index) => (
                <div key={index} className="aspect-[4/5] animate-pulse rounded-2xl bg-zinc-100" />
              ))}
            </div>
          )}

          {isError && (
            <Alert
              variant="danger"
              title="Categories are unavailable"
              action={
                <Button size="sm" variant="outline" onClick={() => void refetch()}>
                  Retry
                </Button>
              }
            >
              {error instanceof Error ? error.message : 'Please try again shortly.'}
            </Alert>
          )}

          {!isLoading && !isError && categories.length === 0 && (
            <EmptyState
              icon={<PackageSearch className="h-5 w-5 text-ink-faint" aria-hidden />}
              title="No categories yet"
              description="Categories appear here once they are published in the admin console."
              action={<ButtonLink to={ROUTES.products}>Browse all products</ButtonLink>}
            />
          )}

          {active.length > 0 && (
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              {active.map((category) => (
                <CategoryCard key={category.id} category={category} />
              ))}
            </div>
          )}
        </div>

        {/* Staff-created categories that are inactive are hidden from shoppers; the
            public list never receives them, so this only appears for admins. */}
        {archived.length > 0 && (
          <div className="mt-14">
            <h2 className="text-sm font-semibold uppercase tracking-[0.08em] text-ink-muted">
              Archived
            </h2>
            <div className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
              {archived.map((category) => (
                <CategoryCard key={category.id} category={category} className="opacity-60" />
              ))}
            </div>
          </div>
        )}

        <div className="mt-14 rounded-2xl border border-zinc-200 bg-surface px-6 py-8 text-center">
          <h2 className="text-lg font-semibold tracking-tight text-ink">
            Cannot decide what you need?
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-ink-muted">
            Browse the full catalogue and use the filters to narrow by price, availability
            or category.
          </p>
          <Link
            to={ROUTES.products}
            className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 hover:underline"
          >
            View all products
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
      </Container>
    </Section>
  )
}
