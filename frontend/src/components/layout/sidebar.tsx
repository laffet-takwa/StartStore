import { useEffect, useRef } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
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

export function Sidebar({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  const { user } = useAuth()
  const { t } = useI18n()
  const location = useLocation()
  const navRef = useRef<HTMLElement | null>(null)
  const indRef = useRef<HTMLSpanElement | null>(null)
  const role = (user?.role || 'sales') as Role

  const visibleSections = sidebarSections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => item.roles.includes(role)),
    }))
    .filter((section) => section.items.length > 0)

  // position the sliding gradient indicator behind the active nav item
  useEffect(() => {
    const move = () => {
      const nav = navRef.current
      const ind = indRef.current
      if (!nav || !ind) return
      const active = nav.querySelector<HTMLElement>('.nv.on')
      if (active) {
        ind.style.opacity = '1'
        ind.style.height = `${active.offsetHeight}px`
        ind.style.width = `${active.offsetWidth}px`
        ind.style.transform = `translate(${active.offsetLeft}px, ${active.offsetTop}px)`
      } else {
        ind.style.opacity = '0'
      }
    }
    move()
    window.addEventListener('resize', move)
    return () => window.removeEventListener('resize', move)
  }, [location.pathname, collapsed, visibleSections.length])

  const initials =
    `${user?.first_name?.[0] || ''}${user?.last_name?.[0] || ''}`.toUpperCase() || 'AD'

  return (
    <aside className="sb">
      <div className="logo" onClick={onToggle} style={{ cursor: 'pointer' }} title="Toggle sidebar">
        {collapsed ? (
          <span className="mk">SS</span>
        ) : (
          <>
            <img src={LOGO_IMAGE} alt="STAR STORE" />
            <small>MANAGER</small>
          </>
        )}
      </div>

      <nav id="nav" ref={navRef}>
        <span className="ind" ref={indRef} style={{ opacity: 0 }} aria-hidden="true" />
        {visibleSections.map((section) => (
          <div key={section.titleKey} style={{ display: 'contents' }}>
            {!collapsed && (
              <p
                style={{
                  padding: '10px 12px 2px',
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: 'var(--mu)',
                }}
              >
                {t(section.titleKey)}
              </p>
            )}
            {section.items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => (isActive ? 'nv on' : 'nv')}
                title={t(item.labelKey)}
              >
                <item.icon size={20} />
                {!collapsed && <span>{t(item.labelKey)}</span>}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      <div className="user">
        <span className="av">{initials}</span>
        {!collapsed && (
          <div className="un" style={{ minWidth: 0 }}>
            <b style={{ display: 'block', fontSize: 13 }}>
              {user?.first_name} {user?.last_name}
            </b>
            <small>{user?.role_display}</small>
          </div>
        )}
      </div>
    </aside>
  )
}
