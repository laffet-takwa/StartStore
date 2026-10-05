import { useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import {
  ArrowLeft,
  ClipboardList,
  FolderTree,
  LayoutDashboard,
  Package,
  Users,
  X,
} from 'lucide-react'

import { Toaster } from '@/components/common/Overlay'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/lib/cn'
import { ROUTES } from '@/utils/constants'

const ADMIN_NAV = [
  { to: ROUTES.admin.dashboard, label: 'Dashboard', icon: LayoutDashboard },
  { to: ROUTES.admin.products, label: 'Products', icon: Package },
  { to: ROUTES.admin.categories, label: 'Categories', icon: FolderTree },
  { to: ROUTES.admin.orders, label: 'Orders', icon: ClipboardList },
  { to: ROUTES.admin.users, label: 'Users', icon: Users },
]

/**
 * Admin shell.
 *
 * A fixed rail on desktop, a slide-over on mobile - one nav definition, two
 * presentations.
 */
export function AdminLayout() {
  const { displayName, isAdmin } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="flex min-h-screen bg-surface">
      <a
        href="#admin-main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[70] focus:rounded-lg focus:bg-ink focus:px-4 focus:py-2 focus:text-sm focus:text-white"
      >
        Skip to content
      </a>

      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-zinc-200 bg-white lg:flex">
        <AdminSidebarContent displayName={displayName} isAdmin={isAdmin} />
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 animate-fade-in bg-ink/40"
            onClick={() => setMobileOpen(false)}
            aria-hidden
          />
          <aside className="absolute inset-y-0 left-0 flex w-64 flex-col bg-white shadow-float">
            <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-3">
              <span className="text-sm font-semibold text-ink">Navigation</span>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                aria-label="Close menu"
                className="rounded-lg p-1.5 text-ink-faint transition-colors hover:bg-zinc-100 hover:text-ink"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <nav className="flex-1 space-y-0.5 p-3">
              {ADMIN_NAV.map((item) => (
                <NavItem
                  key={item.to}
                  to={item.to}
                  icon={<item.icon className="h-4.5 w-4.5" />}
                  label={item.label}
                  onClick={() => setMobileOpen(false)}
                />
              ))}
            </nav>
            <div className="border-t border-zinc-200 p-4">
              <p className="truncate text-sm font-medium text-ink">{displayName}</p>
              <p className="mt-0.5 text-2xs text-ink-muted">
                {isAdmin ? 'Administrator' : 'Staff'}
              </p>
            </div>
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 border-b border-zinc-200 bg-white lg:hidden">
          <div className="flex h-14 items-center justify-between px-4">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="text-sm font-medium text-ink"
            >
              Menu
            </button>
            <Link to={ROUTES.home} className="flex items-center gap-1.5 text-sm text-ink-muted">
              <ArrowLeft className="h-4 w-4" aria-hidden />
              Storefront
            </Link>
          </div>
        </header>

        <main id="admin-main" className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <Outlet />
        </main>
      </div>

      <Toaster />
    </div>
  )
}

function AdminSidebarContent({
  displayName,
  isAdmin,
}: {
  displayName: string
  isAdmin: boolean
}) {
  return (
    <>
      <Link
        to={ROUTES.admin.dashboard}
        className="flex h-16 items-center gap-2 border-b border-zinc-200 px-5"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-ink text-white">
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden>
            <path
              d="M5 9h14M5 12h9M5 15h6"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </span>
        <span className="text-sm font-semibold tracking-tight text-ink">
          StartStore
          <span className="ml-1.5 text-2xs font-medium text-ink-faint">admin</span>
        </span>
      </Link>

      <nav className="flex-1 space-y-0.5 p-3">
        {ADMIN_NAV.map((item) => (
          <NavItem
            key={item.to}
            to={item.to}
            icon={<item.icon className="h-4.5 w-4.5" />}
            label={item.label}
          />
        ))}
      </nav>

      <div className="border-t border-zinc-200 p-4">
        <p className="truncate text-sm font-medium text-ink">{displayName}</p>
        <p className="mt-0.5 text-2xs text-ink-muted">
          {isAdmin ? 'Administrator' : 'Staff'} ·{' '}
          <Link to={ROUTES.home} className="text-brand-700 hover:underline">
            View store
          </Link>
        </p>
      </div>
    </>
  )
}

function NavItem({
  to,
  icon,
  label,
  onClick,
}: {
  to: string
  icon: React.ReactNode
  label: string
  onClick?: () => void
}) {
  const { pathname } = useLocation()
  // The dashboard matches exactly; the other sections own their subtrees.
  const isActive =
    to === ROUTES.admin.dashboard ? pathname === to : pathname.startsWith(to)

  return (
    <NavLink
      to={to}
      onClick={onClick}
      className={cn(
        'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
        isActive
          ? 'bg-brand-50 text-brand-700'
          : 'text-ink-soft hover:bg-zinc-50 hover:text-ink',
      )}
    >
      {icon}
      {label}
    </NavLink>
  )
}
