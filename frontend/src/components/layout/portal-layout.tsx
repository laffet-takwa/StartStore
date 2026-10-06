import { Outlet, NavLink } from 'react-router-dom'
import { LayoutDashboard, User, ShoppingCart, Wrench, FileText } from 'lucide-react'

const portalNavItems = [
  { to: '/portal', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/portal/profile', label: 'Profile', icon: User },
  { to: '/portal/orders', label: 'Orders', icon: ShoppingCart },
  { to: '/portal/repairs', label: 'Repairs', icon: Wrench },
  { to: '/portal/invoices', label: 'Invoices', icon: FileText },
]

export function PortalLayout() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto">
        <nav className="border-b border-slate-200 bg-surface">
          <div className="flex items-center justify-between px-4">
            <div className="flex items-center gap-1 overflow-x-auto">
              {portalNavItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    `flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors whitespace-nowrap ${
                      isActive ? 'text-primary border-b-2 border-primary' : 'text-muted hover:text-slate-700'
                    }`
                  }
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </NavLink>
              ))}
            </div>
          </div>
        </nav>

        <main className="p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
