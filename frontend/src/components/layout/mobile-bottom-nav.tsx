import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Wrench, Users, ShoppingCart, MoreHorizontal } from 'lucide-react'
import { useAuth } from '@/context/auth-context'
import type { Role } from '@/types'
import { useState } from 'react'
import { Drawer } from '@/components/common/drawer'
import { cn } from '@/utils/cn'

const mobileNavItems = [
  { to: '/dashboard', label: 'Home', icon: LayoutDashboard, roles: ['admin', 'manager', 'technician', 'sales'] },
  { to: '/repairs', label: 'Repairs', icon: Wrench, roles: ['admin', 'manager', 'technician'] },
  { to: '/customers', label: 'Customers', icon: Users, roles: ['admin', 'manager', 'sales', 'technician'] },
  { to: '/sales', label: 'Sales', icon: ShoppingCart, roles: ['admin', 'manager', 'sales'] },
  { to: '#more', label: 'More', icon: MoreHorizontal, roles: ['admin', 'manager', 'sales', 'technician'] },
]

const moreItems = [
  { to: '/devices', label: 'Devices' },
  { to: '/products', label: 'Products' },
  { to: '/inventory', label: 'Inventory' },
  { to: '/invoices', label: 'Invoices' },
  { to: '/payments', label: 'Payments' },
  { to: '/employees', label: 'Employees', roles: ['admin'] },
  { to: '/reports', label: 'Reports' },
  { to: '/notifications', label: 'Notifications' },
  { to: '/settings', label: 'Settings' },
]

export function MobileBottomNav() {
  const { user } = useAuth()
  const role = (user?.role || 'sales') as Role
  const [moreOpen, setMoreOpen] = useState(false)

  const visible = mobileNavItems.filter((item) => item.roles.includes(role))
  const visibleMore = moreItems.filter((item) => !item.roles || item.roles.includes(role))

  return (
    <>
      <nav className={cn('lg:hidden fixed bottom-0 left-0 right-0 z-40 border-t bg-surface/90 backdrop-blur', 'border-base')}>
        <div className="flex items-center justify-between px-2 pb-safe">
          {visible.map((item) => {
            if (item.to === '#more') {
              return (
                <button
                  key={item.to}
                  onClick={() => setMoreOpen(true)}
                  className={cn('flex flex-col items-center gap-0.5 px-3 py-2 text-xs transition-colors', 'text-muted-base hover:text-base')}
                >
                  <item.icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </button>
              )
            }
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    'flex flex-col items-center gap-0.5 px-3 py-2 text-xs transition-colors',
                    isActive ? 'text-primary' : 'text-muted-base hover:text-base'
                  )
                }
              >
                <item.icon className="h-5 w-5" />
                <span>{item.label}</span>
              </NavLink>
            )
          })}
        </div>
      </nav>

      <Drawer open={moreOpen} onClose={() => setMoreOpen(false)} title="More">
        <div className="p-2">
          {visibleMore.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setMoreOpen(false)}
              className={cn('block rounded-md px-3 py-2 text-sm transition-colors', 'text-muted-base hover:bg-surface-secondary dark:hover:bg-dark-surface-secondary')}
            >
              {item.label}
            </NavLink>
          ))}
        </div>
      </Drawer>
    </>
  )
}
