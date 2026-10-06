import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Store, Menu, X, Search, ShoppingCart, User } from 'lucide-react'
import { useAuth } from '@/context/auth-context'
import { Button } from '@/components/ui'

export function Navbar() {
  const [open, setOpen] = useState(false)
  const { user } = useAuth()

  return (
    <header className="sticky top-0 z-50 bg-surface/80 backdrop-blur border-b border-base">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-lg brand-gradient text-white flex items-center justify-center">
              <Store className="h-5 w-5" />
            </div>
            <span className="text-lg font-bold text-base">STAR STORE</span>
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            <Link to="/" className="text-sm font-medium text-muted hover:text-base transition-colors">Home</Link>
            <Link to="/shop" className="text-sm font-medium text-muted hover:text-base transition-colors">Shop</Link>
            <Link to="/categories" className="text-sm font-medium text-muted hover:text-base transition-colors">Categories</Link>
            <Link to="/services" className="text-sm font-medium text-muted hover:text-base transition-colors">Services</Link>
            <Link to="/repairs" className="text-sm font-medium text-muted hover:text-base transition-colors">Repairs</Link>
            <Link to="/track" className="text-sm font-medium text-muted hover:text-base transition-colors">Track</Link>
          </nav>

          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
                <input
                  type="text"
                  placeholder="Search products..."
                  className="w-64 pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>
            <Link to="/cart" className="p-2 rounded-md hover:bg-surface-secondary transition-colors">
              <ShoppingCart className="h-5 w-5 text-muted" />
            </Link>
            {user ? (
              <Link to="/portal" className="p-2 rounded-md hover:bg-surface-secondary transition-colors">
                <User className="h-5 w-5 text-muted" />
              </Link>
            ) : (
              <Link to="/login">
                <Button size="sm">Sign in</Button>
              </Link>
            )}
            <button onClick={() => setOpen(!open)} className="md:hidden p-2 rounded-md hover:bg-surface-secondary transition-colors">
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {open && (
          <div className="md:hidden py-4 border-t border-base animate-slide-down">
            <nav className="flex flex-col gap-3">
              <Link to="/" className="text-sm font-medium text-muted hover:text-base" onClick={() => setOpen(false)}>Home</Link>
              <Link to="/shop" className="text-sm font-medium text-muted hover:text-base" onClick={() => setOpen(false)}>Shop</Link>
              <Link to="/categories" className="text-sm font-medium text-muted hover:text-base" onClick={() => setOpen(false)}>Categories</Link>
              <Link to="/services" className="text-sm font-medium text-muted hover:text-base" onClick={() => setOpen(false)}>Services</Link>
              <Link to="/repairs" className="text-sm font-medium text-muted hover:text-base" onClick={() => setOpen(false)}>Repairs</Link>
              <Link to="/track" className="text-sm font-medium text-muted hover:text-base" onClick={() => setOpen(false)}>Track Repair</Link>
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}
