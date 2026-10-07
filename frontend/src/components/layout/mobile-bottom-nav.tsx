import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Wrench, Users, ShoppingCart, MoreHorizontal } from 'lucide-react'
import { useAuth } from '@/context/auth-context'
import { useI18n } from '@/i18n/context'
import type { Role } from '@/types'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { BottomSheet } from '@/components/common/bottom-sheet'
import { cn } from '@/utils/cn'

const mobileNavItems = [
  { to: '/dashboard', labelKey: 'dashboard.title', icon: LayoutDashboard, roles: ['admin', 'manager', 'technician', 'sales'] },
  { to: '/repairs', labelKey: 'repairs.title', icon: Wrench, roles: ['admin', 'manager', 'technician'] },
  { to: '/customers', labelKey: 'customers.title', icon: Users, roles: ['admin', 'manager', 'sales', 'technician'] },
  { to: '/sales', labelKey: 'sales.title', icon: ShoppingCart, roles: ['admin', 'manager', 'sales'] },
  { to: '#more', labelKey: 'common.actions', icon: MoreHorizontal, roles: ['admin', 'manager', 'sales', 'technician'] },
]

const moreItems = [
  { to: '/devices', labelKey: 'devices.title' },
  { to: '/products', labelKey: 'products.title' },
  { to: '/inventory', labelKey: 'inventory.title' },
  { to: '/invoices', labelKey: 'invoices.title' },
  { to: '/payments', labelKey: 'payments.title' },
  { to: '/employees', labelKey: 'employees.title', roles: ['admin'] },
  { to: '/reports', labelKey: 'reports.title' },
  { to: '/notifications', labelKey: 'notifications.title' },
  { to: '/settings', labelKey: 'settings.title' },
]

export function MobileBottomNav() {
  const { user } = useAuth()
  const { t } = useI18n()
  const role = (user?.role || 'sales') as Role
  const [moreOpen, setMoreOpen] = useState(false)

  const visible = mobileNavItems.filter((item) => item.roles.includes(role))
  const visibleMore = moreItems.filter((item) => !item.roles || item.roles.includes(role))

  return (
    <>
      <nav
        className={cn(
          'lg:hidden fixed bottom-0 left-0 right-0 z-40 border-t bg-white/90 dark:bg-dark-surface/90 backdrop-blur-md',
          'border-slate-200 dark:border-dark-border safe-area-pb'
        )}
      >
        <div className="flex items-center justify-around px-2 h-[60px]">
          {visible.map((item) => {
            if (item.to === '#more') {
              return (
                <button
                  key={item.to}
                  onClick={() => setMoreOpen(true)}
                  className={cn(
                    'flex flex-col items-center justify-center gap-0.5 px-3 py-1.5 text-[11px] font-medium transition-all rounded-xl min-w-[64px]',
                    'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
                  )}
                  >
                    <item.icon className="h-5 w-5" />
                    <span>{t(item.labelKey)}</span>
                  </button>
              )
            }
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    'flex flex-col items-center justify-center gap-0.5 px-3 py-1.5 text-[11px] font-medium transition-all rounded-xl min-w-[64px] relative',
                    isActive
                      ? 'text-primary'
                      : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <motion.div
                        layoutId="mobile-nav-indicator"
                        className="absolute -top-1.5 h-1 w-6 rounded-full bg-primary"
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                      />
                    )}
                    <item.icon className="h-5 w-5" />
                     <span>{t(item.labelKey)}</span>
                  </>
                )}
              </NavLink>
            )
          })}
        </div>
      </nav>

      <BottomSheet open={moreOpen} onClose={() => setMoreOpen(false)} title={t('common.actions')}>
        <div className="space-y-1">
          {visibleMore.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setMoreOpen(false)}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-dark-surface-secondary'
              )}
            >
              {t(item.labelKey)}
            </NavLink>
          ))}
        </div>
      </BottomSheet>
    </>
  )
}
