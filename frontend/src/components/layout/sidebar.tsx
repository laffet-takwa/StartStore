import { NavLink, Link } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  Monitor,
  Wrench,
  Package,
  FolderTree,
  Truck,
  Warehouse,
  ShoppingCart,
  CreditCard,
  FileText,
  BarChart3,
  Bell,
  ScrollText,
  UserCog,
} from 'lucide-react'
import { useAuth } from '@/context/auth-context'
import type { Role } from '@/types'
import { cn } from '@/utils/cn'
import { LOGO_IMAGE } from '@/utils/images'
import { useI18n } from '@/i18n/context'

const sidebarSections = [
  {
    titleKey: 'navigation.main',
    items: [
      { to: '/dashboard', labelKey: 'dashboard.title', icon: LayoutDashboard, roles: ['admin', 'manager', 'technician', 'sales'] },
    ],
  },
  {
    titleKey: 'navigation.operations',
    items: [
      { to: '/repairs', labelKey: 'repairs.title', icon: Wrench, roles: ['admin', 'manager', 'technician'] },
      { to: '/customers', labelKey: 'customers.title', icon: Users, roles: ['admin', 'manager', 'sales', 'technician'] },
      { to: '/devices', labelKey: 'devices.title', icon: Monitor, roles: ['admin', 'manager', 'sales', 'technician'] },
      { to: '/sales', labelKey: 'sales.title', icon: ShoppingCart, roles: ['admin', 'manager', 'sales'] },
    ],
  },
  {
    titleKey: 'navigation.catalog',
    items: [
      { to: '/products', labelKey: 'products.title', icon: Package, roles: ['admin', 'manager', 'sales', 'technician'] },
      { to: '/categories', labelKey: 'categories.title', icon: FolderTree, roles: ['admin', 'manager'] },
      { to: '/suppliers', labelKey: 'suppliers.title', icon: Truck, roles: ['admin', 'manager'] },
    ],
  },
  {
    titleKey: 'navigation.inventory',
    items: [
      { to: '/inventory', labelKey: 'inventory.title', icon: Warehouse, roles: ['admin', 'manager'] },
    ],
  },
  {
    titleKey: 'navigation.finance',
    items: [
      { to: '/payments', labelKey: 'payments.title', icon: CreditCard, roles: ['admin', 'manager', 'sales'] },
      { to: '/invoices', labelKey: 'invoices.title', icon: FileText, roles: ['admin', 'manager', 'sales'] },
      { to: '/reports', labelKey: 'reports.title', icon: BarChart3, roles: ['admin', 'manager'] },
    ],
  },
  {
    titleKey: 'navigation.system',
    items: [
      { to: '/notifications', labelKey: 'notifications.title', icon: Bell, roles: ['admin', 'manager', 'technician', 'sales'] },
      { to: '/audit-logs', labelKey: 'auditLogs.title', icon: ScrollText, roles: ['admin', 'manager'] },
      { to: '/employees', labelKey: 'employees.title', icon: UserCog, roles: ['admin'] },
    ],
  },
]

export function Sidebar({ collapsed, onClose }: { collapsed: boolean; onClose?: () => void }) {
  const { user } = useAuth()
  const { t } = useI18n()
  const role = (user?.role || 'sales') as Role

  const visibleSections = sidebarSections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => item.roles.includes(role)),
    }))
    .filter((section) => section.items.length > 0)

  return (
    <aside
      className={cn(
        'flex flex-col transition-all duration-200 ease-in-out border-r border-slate-200 dark:border-dark-border bg-white dark:bg-dark-surface',
        collapsed ? 'w-[72px]' : 'w-64'
      )}
    >
      {/* Logo */}
      <div className="h-14 flex items-center justify-center border-b border-slate-200 dark:border-dark-border">
        {!collapsed ? (
          <Link to="/dashboard" className="flex items-center gap-2.5">
            <img
              src={LOGO_IMAGE}
              alt="STAR STORE"
              className="h-8 w-8 rounded-lg object-contain"
            />
            <div className="leading-tight">
              <span className="text-sm font-bold text-slate-900 dark:text-slate-50 block">STAR STORE</span>
              <span className="text-[10px] text-muted dark:text-slate-500 block">Management</span>
            </div>
          </Link>
        ) : (
          <Link to="/dashboard" className="flex items-center justify-center">
            <img
              src={LOGO_IMAGE}
              alt="STAR STORE"
              className="h-8 w-8 rounded-lg object-contain"
            />
          </Link>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3 px-2.5 space-y-5 scrollbar-thin">
        {visibleSections.map((section) => (
          <div key={section.titleKey}>
            {!collapsed && (
              <p className="px-2 mb-1.5 text-[10px] font-semibold text-muted dark:text-slate-500 uppercase tracking-wider">
                {t(section.titleKey)}
              </p>
            )}
            <div className="space-y-0.5">
              {section.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={onClose}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 px-2.5 py-2 rounded-lg text-sm font-medium transition-all relative group',
                      isActive
                        ? 'bg-primary-50 text-primary dark:bg-dark-primary-light dark:text-dark-primary'
                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-dark-surface-secondary hover:text-slate-900 dark:hover:text-slate-100',
                      'animate-slide-in-right'
                    )
                  }
                  style={{ animationDelay: `${Math.random() * 60}ms`, animationFillMode: 'both' }}
                >
                  {({ isActive }) => (
                    <>
                      {isActive && (
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-primary dark:bg-dark-primary" />
                      )}
                      <item.icon className={cn('h-[18px] w-[18px] flex-shrink-0 transition-colors', isActive ? 'text-primary dark:text-dark-primary' : 'text-muted dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300')} />
                      {!collapsed && <span className="truncate">{t(item.labelKey)}</span>}
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-slate-200 dark:border-dark-border">
        {!collapsed ? (
          <p className="text-[10px] text-muted dark:text-slate-500 text-center">STAR STORE v1.0</p>
        ) : (
          <div className="flex justify-center">
            <div className="h-6 w-6 rounded brand-gradient opacity-80" />
          </div>
        )}
      </div>
    </aside>
  )
}
