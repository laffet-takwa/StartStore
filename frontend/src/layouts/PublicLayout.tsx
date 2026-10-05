import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'

import { Toaster } from '@/components/common/Overlay'
import { CartDrawer } from '@/components/cart/CartDrawer'
import { Footer } from '@/components/layout/Footer'
import { Navbar } from '@/components/layout/Navbar'
import { useCart } from '@/hooks/useCart'

/**
 * Storefront shell: sticky nav, routed content, footer, plus the global bag
 * drawer and toast viewport.
 *
 * The cart query is mounted here so the badge and drawer behave on every page,
 * and only for signed-in visitors.
 */
export function PublicLayout() {
  useCart()
  const { pathname } = useLocation()

  // The browser only resets scroll for hash links, so route changes would
  // otherwise land mid-page (and back/forward would keep the old offset).
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior })
  }, [pathname])

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[70] focus:rounded-lg focus:bg-ink focus:px-4 focus:py-2 focus:text-sm focus:text-white"
      >
        Skip to content
      </a>

      <Navbar />

      <main id="main" className="flex-1">
        <Outlet />
      </main>

      <Footer />

      <CartDrawer />
      <Toaster />
    </div>
  )
}
