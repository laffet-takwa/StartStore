import { Outlet, NavLink } from 'react-router-dom'
import { motion } from 'framer-motion'
import { LayoutDashboard, User, ShoppingCart, Wrench, FileText } from 'lucide-react'
import { useI18n } from '@/i18n/context'

const portalNavItems = [
  { to: '/portal', labelKey: 'portal.dashboard', icon: LayoutDashboard, end: true },
  { to: '/portal/profile', labelKey: 'navigation.profile', icon: User },
  { to: '/portal/orders', labelKey: 'sales.title', icon: ShoppingCart },
  { to: '/portal/repairs', labelKey: 'repairs.title', icon: Wrench },
  { to: '/portal/invoices', labelKey: 'invoices.title', icon: FileText },
]

export function PortalLayout() {
  const { t } = useI18n()

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto">
        <nav className="border-b border-slate-200 dark:border-dark-border bg-surface">
          <div className="flex items-center justify-between px-4">
            <div className="flex items-center gap-1 overflow-x-auto">
              {portalNavItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    `flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors whitespace-nowrap relative ${
                      isActive ? 'text-primary' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      {isActive && (
                        <motion.div
                          layoutId="portal-nav-indicator"
                          className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full bg-primary"
                          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                        />
                      )}
                      <item.icon className="h-4 w-4" />
                      {t(item.labelKey)}
                    </>
                  )}
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
