import { Link } from 'react-router-dom'
import { Compass } from 'lucide-react'

import { ButtonLink } from '@/components/common'
import { Container, Section } from '@/components/layout/Primitives'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { ROUTES } from '@/utils/constants'

export default function NotFoundPage() {
  useDocumentTitle('Page not found — StartStore')

  return (
    <Section>
      <Container size="narrow">
        <div className="flex flex-col items-center py-16 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-700">
            <Compass className="h-6 w-6" aria-hidden />
          </span>

          <p className="mt-6 text-xs font-semibold uppercase tracking-[0.16em] text-brand-600">
            404
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-ink">
            We could not find that page
          </h1>
          <p className="mt-3 max-w-md text-[0.9375rem] leading-relaxed text-ink-muted">
            The link may be out of date, or the product you were after may have been
            archived. The catalogue is a good place to pick things back up.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <ButtonLink to={ROUTES.products}>Shop all products</ButtonLink>
            <ButtonLink to={ROUTES.home} variant="outline">
              Back to home
            </ButtonLink>
          </div>

          <p className="mt-8 text-sm text-ink-muted">
            Looking for an order?{' '}
            <Link to={ROUTES.orders} className="font-medium text-brand-700 hover:underline">
              Open your order history
            </Link>
          </p>
        </div>
      </Container>
    </Section>
  )
}
