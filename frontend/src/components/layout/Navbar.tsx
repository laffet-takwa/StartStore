import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import {
  ChevronDown,
  Heart,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  Search,
  ShoppingBag,
  ShoppingCart,
  Tags,
  Users,
  X,
} from 'lucide-react'

import { Avatar, Badge, Button, IconButton } from '@/components/common'
import { Container } from '@/components/layout/Primitives'
import { useAuth } from '@/hooks/useAuth'
import { useCart } from '@/hooks/useCart'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { cn } from '@/lib/cn'
import { ROUTES } from '@/utils/constants'

const NAV_LINKS = [
  { to: ROUTES.products, label: 'Shop' },
  { to: ROUTES.categories, label: 'Categories' },
]

export function Navbar() {
  const { user, isAuthenticated, isAdmin, displayName, logout } = useAuth()
  const { count } = useCart()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const location = useLocation()

  // Close the mobile sheet on navigation so a tap does not leave it hanging open.
  useEffect(() => {
    setMobileOpen(false)
    setSearchOpen(false)
  }, [location.pathname])

  return (
    <>
      <AnnouncementBar />

      <header className="sticky top-0 z-40 border-b border-zinc-200/70 bg-white/85 backdrop-blur-md">
        <Container>
          <div className="flex h-16 items-center gap-3 lg:h-20">
            {/* Mobile: menu trigger */}
            <IconButton
              label={mobileOpen ? 'Close menu' : 'Open menu'}
              className="lg:hidden"
              onClick={() => setMobileOpen((open) => !open)}
            >
              <Menu className="h-5 w-5" />
            </IconButton>

            <Link
              to={ROUTES.home}
              className="flex shrink-0 items-center gap-2 text-ink transition-opacity hover:opacity-80"
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
              <span className="text-base font-semibold tracking-tight">StartStore</span>
            </Link>

            {/* Desktop nav */}
            <nav className="ml-6 hidden items-center gap-1 lg:flex">
              {NAV_LINKS.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  className={({ isActive }) =>
                    cn(
                      'rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-zinc-100 text-ink'
                        : 'text-ink-soft hover:bg-zinc-50 hover:text-ink',
                    )
                  }
                >
                  {link.label}
                </NavLink>
              ))}
              {isAdmin && (
                <NavLink
                  to={ROUTES.admin.dashboard}
                  className={({ isActive }) =>
                    cn(
                      'inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-brand-50 text-brand-700'
                        : 'text-brand-700 hover:bg-brand-50',
                    )
                  }
                >
                  <LayoutDashboard className="h-4 w-4" aria-hidden />
                  Admin
                </NavLink>
              )}
            </nav>

            {/* Desktop search */}
            <div className="ml-auto hidden max-w-sm flex-1 md:block">
              <SearchBar />
            </div>

            <div className="ml-auto flex items-center gap-1 md:ml-0">
              <IconButton
                label="Search"
                className="md:hidden"
                onClick={() => setSearchOpen(true)}
              >
                <Search className="h-5 w-5" />
              </IconButton>

              <IconButton
                label="Wishlist"
                className="hidden sm:inline-flex"
                onClick={() => navigate(ROUTES.wishlist)}
              >
                <Heart className="h-5 w-5" />
              </IconButton>

              {isAuthenticated && (
                <Link
                  to={ROUTES.cart}
                  aria-label={`Bag, ${count} item${count === 1 ? '' : 's'}`}
                  className="relative hidden h-10 w-10 items-center justify-center rounded-lg text-ink-soft transition-colors hover:bg-zinc-100 hover:text-ink sm:inline-flex"
                >
                  <ShoppingCart className="h-5 w-5" />
                  {count > 0 && (
                    <span className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-brand-600 px-1 text-[10px] font-semibold text-white">
                      {count > 99 ? '99+' : count}
                    </span>
                  )}
                </Link>
              )}

              {isAuthenticated ? (
                <UserMenu
                  displayName={displayName}
                  email={user?.email ?? ''}
                  avatarUrl={user?.avatar_url ?? null}
                  isAdmin={isAdmin}
                  onLogout={logout}
                />
              ) : (
                <div className="hidden items-center gap-2 sm:flex">
                  <Button variant="ghost" size="sm" onClick={() => navigate(ROUTES.login)}>
                    Sign in
                  </Button>
                  <Button size="sm" onClick={() => navigate(ROUTES.register)}>
                    Create account
                  </Button>
                </div>
              )}
            </div>
          </div>
        </Container>
      </header>

      {searchOpen && (
        <div className="fixed inset-x-0 top-0 z-50 border-b border-zinc-200 bg-white p-4 shadow-float md:hidden">
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <SearchBar autoFocus onSubmitted={() => setSearchOpen(false)} />
            </div>
            <IconButton label="Close search" onClick={() => setSearchOpen(false)}>
              <X className="h-5 w-5" />
            </IconButton>
          </div>
        </div>
      )}

      {mobileOpen && <MobileNav isAdmin={isAdmin} onNavigate={() => setMobileOpen(false)} />}
    </>
  )
}

/* -------------------------------------------------------------------------- */
/* Announcement                                                                  */
/* -------------------------------------------------------------------------- */

function AnnouncementBar() {
  return (
    <div className="bg-ink text-white">
      <Container size="wide">
        <div className="flex h-9 items-center justify-center gap-2 text-2xs font-medium tracking-wide">
          <span className="hidden sm:inline">Free delivery on orders over $100</span>
          <span className="sm:hidden">Free delivery over $100</span>
          <span className="text-white/30" aria-hidden>
            ·
          </span>
          <span className="text-white/70">30-day returns</span>
        </div>
      </Container>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* Search                                                                       */
/* -------------------------------------------------------------------------- */

export function SearchBar({
  autoFocus,
  onSubmitted,
  className,
}: {
  autoFocus?: boolean
  onSubmitted?: () => void
  className?: string
}) {
  const navigate = useNavigate()
  const [term, setTerm] = useState('')
  const debounced = useDebouncedValue(term, 400)
  const firstRender = useRef(true)

  // Typing navigates to the search page; the first render must not, or the app
  // would bounce to /search on mount.
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false
      return
    }
    const value = debounced.trim()
    if (value.length >= 2) navigate(`${ROUTES.search}?q=${encodeURIComponent(value)}`)
  }, [debounced, navigate])

  return (
    <form
      role="search"
      onSubmit={(event) => {
        event.preventDefault()
        const value = term.trim()
        if (value) {
          navigate(`${ROUTES.search}?q=${encodeURIComponent(value)}`)
          onSubmitted?.()
        }
      }}
      className={cn('relative', className)}
    >
      <Search
        className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint"
        aria-hidden
      />
      <input
        type="search"
        value={term}
        autoFocus={autoFocus}
        onChange={(event) => setTerm(event.target.value)}
        placeholder="Search products"
        aria-label="Search products"
        className="h-10 w-full rounded-xl border border-zinc-300 bg-surface pl-10 pr-3 text-sm text-ink placeholder:text-ink-faint transition-all focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20"
      />
    </form>
  )
}

/* -------------------------------------------------------------------------- */
/* Account menu                                                                  */
/* -------------------------------------------------------------------------- */

function UserMenu({
  displayName,
  email,
  avatarUrl,
  isAdmin,
  onLogout,
}: {
  displayName: string
  email: string
  avatarUrl: string | null
  isAdmin: boolean
  onLogout: () => Promise<void>
}) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()

  useEffect(() => {
    if (!open) return
    const onPointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false)
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  const links = [
    { to: ROUTES.profile, label: 'Profile', icon: Users },
    { to: ROUTES.orders, label: 'My orders', icon: ShoppingBag },
    { to: ROUTES.wishlist, label: 'Wishlist', icon: Package },
    { to: ROUTES.addresses, label: 'Addresses', icon: Tags },
  ]

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((state) => !state)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="flex h-10 items-center gap-1.5 rounded-lg pl-1 pr-2 transition-colors hover:bg-zinc-100"
      >
        <Avatar name={displayName} src={avatarUrl} size={32} />
        <ChevronDown className="hidden h-3.5 w-3.5 text-ink-faint sm:block" aria-hidden />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-12 w-60 animate-scale-in overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-float"
        >
          <div className="border-b border-zinc-100 px-4 py-3">
            <p className="truncate text-sm font-semibold text-ink">{displayName}</p>
            <p className="truncate text-xs text-ink-muted">{email}</p>
            {isAdmin && (
              <Badge variant="brand" className="mt-2">
                Administrator
              </Badge>
            )}
          </div>

          <div className="p-1.5">
            {links.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                role="menuitem"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-ink-soft transition-colors hover:bg-zinc-50 hover:text-ink"
              >
                <link.icon className="h-4 w-4 text-ink-faint" aria-hidden />
                {link.label}
              </Link>
            ))}
            {isAdmin && (
              <Link
                to={ROUTES.admin.dashboard}
                role="menuitem"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-brand-700 transition-colors hover:bg-brand-50"
              >
                <LayoutDashboard className="h-4 w-4" aria-hidden />
                Admin dashboard
              </Link>
            )}
          </div>

          <div className="border-t border-zinc-100 p-1.5">
            <button
              type="button"
              role="menuitem"
              onClick={async () => {
                setOpen(false)
                await onLogout()
                navigate(ROUTES.home)
              }}
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-ink-soft transition-colors hover:bg-zinc-50 hover:text-ink"
            >
              <LogOut className="h-4 w-4 text-ink-faint" aria-hidden />
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* Mobile navigation                                                             */
/* -------------------------------------------------------------------------- */

function MobileNav({ isAdmin, onNavigate }: { isAdmin: boolean; onNavigate: () => void }) {
  const { count } = useCart()

  return (
    <div className="fixed inset-0 top-[100px] z-30 lg:hidden">
      <div className="absolute inset-0 animate-fade-in bg-ink/30" onClick={onNavigate} aria-hidden />
      <nav className="absolute inset-x-0 top-0 animate-slide-up border-b border-zinc-200 bg-white px-4 py-4 shadow-float">
        <div className="mb-4">
          <SearchBar onSubmitted={onNavigate} />
        </div>
        <ul className="space-y-1">
          {NAV_LINKS.map((link) => (
            <li key={link.to}>
              <Link
                to={link.to}
                onClick={onNavigate}
                className="flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium text-ink transition-colors hover:bg-zinc-50"
              >
                {link.label}
              </Link>
            </li>
          ))}
          <li>
            <Link
              to={ROUTES.wishlist}
              onClick={onNavigate}
              className="flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium text-ink transition-colors hover:bg-zinc-50"
            >
              Wishlist
            </Link>
          </li>
          <li>
            <Link
              to={ROUTES.cart}
              onClick={onNavigate}
              className="flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium text-ink transition-colors hover:bg-zinc-50"
            >
              Bag
              {count > 0 && (
                <Badge variant="brand">{count} item{count === 1 ? '' : 's'}</Badge>
              )}
            </Link>
          </li>
          {isAdmin && (
            <li>
              <Link
                to={ROUTES.admin.dashboard}
                onClick={onNavigate}
                className="flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium text-brand-700 transition-colors hover:bg-brand-50"
              >
                Admin dashboard
              </Link>
            </li>
          )}
        </ul>
      </nav>
    </div>
  )
}
