import { Link, Outlet } from 'react-router-dom'

import { Toaster } from '@/components/common/Overlay'
import { ROUTES } from '@/utils/constants'

/**
 * Minimal shell for login/register.
 *
 * Deliberately chrome-free: a focused split layout with the value proposition on
 * one side and the form on the other, so nothing competes with the task of
 * signing in.
 */
export function AuthLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-white lg:grid lg:grid-cols-2">
      {/* Brand panel, hidden on small screens where it would just push the form down. */}
      <aside className="relative hidden overflow-hidden bg-ink p-10 lg:flex lg:flex-col lg:justify-between">
        <div
          className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-brand-600/25 blur-3xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -bottom-32 -left-20 h-80 w-80 rounded-full bg-brand-500/20 blur-3xl"
          aria-hidden
        />

        <Link to={ROUTES.home} className="relative flex items-center gap-2 text-white">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 backdrop-blur">
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden>
              <path d="M5 9h14M5 12h9M5 15h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </span>
          <span className="text-base font-semibold tracking-tight">StartStore</span>
        </Link>

        <div className="relative max-w-md">
          <h2 className="text-3xl font-semibold leading-tight tracking-tight text-white">
            Everything you need, in one place.
          </h2>
          <p className="mt-4 text-[0.9375rem] leading-relaxed text-white/60">
            Save your favourites, track orders and check out in seconds. Your bag and
            addresses stay with your account on every device.
          </p>

          <ul className="mt-8 space-y-3 text-sm text-white/70">
            {[
              'Free delivery on orders over $100',
              '30-day returns, no questions asked',
              'Secure checkout with rotating tokens',
            ].map((line) => (
              <li key={line} className="flex items-center gap-2.5">
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-white/15">
                  <svg viewBox="0 0 24 24" className="h-2.5 w-2.5" fill="none" stroke="currentColor" strokeWidth="3.5">
                    <path d="M5 13l4 4L19 7" />
                  </svg>
                </span>
                {line}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-2xs text-white/40">
          © {new Date().getFullYear()} StartStore
        </p>
      </aside>

      <main className="flex flex-1 items-center justify-center px-4 py-12 sm:px-8">
        <div className="w-full max-w-sm">
          <Link
            to={ROUTES.home}
            className="mb-8 inline-flex items-center gap-2 text-ink lg:hidden"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-ink text-white">
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden>
                <path d="M5 9h14M5 12h9M5 15h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </span>
            <span className="text-base font-semibold tracking-tight">StartStore</span>
          </Link>

          <Outlet />
        </div>
      </main>

      <Toaster />
    </div>
  )
}
