import { Link } from 'react-router-dom'
import { Facebook, Instagram, Twitter, Youtube } from 'lucide-react'

import { Container } from '@/components/layout/Primitives'
import { ROUTES } from '@/utils/constants'

const COLUMNS = [
  {
    title: 'Shop',
    links: [
      { label: 'All products', to: ROUTES.products },
      { label: 'Categories', to: ROUTES.categories },
      { label: 'Wishlist', to: ROUTES.wishlist },
      { label: 'Your bag', to: ROUTES.cart },
    ],
  },
  {
    title: 'Account',
    links: [
      { label: 'Sign in', to: ROUTES.login },
      { label: 'Create account', to: ROUTES.register },
      { label: 'My orders', to: ROUTES.orders },
      { label: 'Addresses', to: ROUTES.addresses },
    ],
  },
  {
    title: 'Support',
    links: [
      { label: 'Shipping & delivery', to: ROUTES.products },
      { label: 'Returns', to: ROUTES.products },
      { label: 'Track an order', to: ROUTES.orders },
      { label: 'Contact us', to: ROUTES.products },
    ],
  },
]

const SOCIALS = [
  { label: 'Instagram', icon: Instagram },
  { label: 'Twitter', icon: Twitter },
  { label: 'YouTube', icon: Youtube },
  { label: 'Facebook', icon: Facebook },
]

export function Footer() {
  return (
    <footer className="mt-auto border-t border-zinc-200 bg-surface">
      <Container size="wide">
        <div className="grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-5 lg:gap-8">
          <div className="lg:col-span-2">
            <Link to={ROUTES.home} className="inline-flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-ink text-white">
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden>
                  <path d="M5 9h14M5 12h9M5 15h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </span>
              <span className="text-base font-semibold tracking-tight text-ink">StartStore</span>
            </Link>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-ink-muted">
              Curated essentials for modern life — considered design, honest materials and
              delivery you can rely on.
            </p>
            <div className="mt-6 flex items-center gap-2">
              {SOCIALS.map(({ label, icon: Icon }) => (
                <a
                  key={label}
                  href="#"
                  aria-label={label}
                  onClick={(event) => event.preventDefault()}
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-300 bg-white text-ink-muted transition-all duration-150 hover:-translate-y-0.5 hover:border-zinc-400 hover:text-ink"
                >
                  <Icon className="h-4 w-4" aria-hidden />
                </a>
              ))}
            </div>
          </div>

          {COLUMNS.map((column) => (
            <div key={column.title}>
              <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-ink">
                {column.title}
              </h3>
              <ul className="mt-4 space-y-2.5">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      to={link.to}
                      className="text-sm text-ink-muted transition-colors hover:text-ink"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-4 border-t border-zinc-200 py-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-ink-muted">
            © {new Date().getFullYear()} StartStore. All rights reserved.
          </p>
          <ul className="flex flex-wrap items-center gap-x-6 gap-y-2">
            {['Privacy', 'Terms', 'Cookies', 'Accessibility'].map((label) => (
              <li key={label}>
                <a
                  href="#"
                  onClick={(event) => event.preventDefault()}
                  className="text-xs text-ink-muted transition-colors hover:text-ink"
                >
                  {label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </Container>
    </footer>
  )
}
