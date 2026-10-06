import { NavLink } from 'react-router-dom'
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

const allNavItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'manager', 'technician', 'sales'] },
  { to: '/customers', label: 'Customers', icon: Users, roles: ['admin', 'manager', 'sales', 'technician'] },
  { to: '/devices', label: 'Devices', icon: Monitor, roles: ['admin', 'manager', 'sales', 'technician'] },
  { to: '/repairs', label: 'Repairs', icon: Wrench, roles: ['admin', 'manager', 'technician'] },
  { to: '/products', label: 'Products', icon: Package, roles: ['admin', 'manager', 'sales', 'technician'] },
  { to: '/categories', label: 'Categories', icon: FolderTree, roles: ['admin', 'manager'] },
  { to: '/suppliers', label: 'Suppliers', icon: Truck, roles: ['admin', 'manager'] },
  { to: '/inventory', label: 'Inventory', icon: Warehouse, roles: ['admin', 'manager'] },
  { to: '/sales', label: 'Sales', icon: ShoppingCart, roles: ['admin', 'manager', 'sales'] },
  { to: '/payments', label: 'Payments', icon: CreditCard, roles: ['admin', 'manager', 'sales'] },
  { to: '/invoices', label: 'Invoices', icon: FileText, roles: ['admin', 'manager', 'sales'] },
  { to: '/reports', label: 'Reports', icon: BarChart3, roles: ['admin', 'manager'] },
  { to: '/notifications', label: 'Notifications', icon: Bell, roles: ['admin', 'manager', 'technician', 'sales'] },
  { to: '/audit-logs', label: 'Audit Logs', icon: ScrollText, roles: ['admin', 'manager'] },
  { to: '/employees', label: 'Employees', icon: UserCog, roles: ['admin'] },
]

export function Sidebar({ collapsed, onClose }: { collapsed: boolean; onClose?: () => void }) {
  const { user } = useAuth()
  const role = (user?.role || 'sales') as Role

  const visible = allNavItems.filter((item) => item.roles.includes(role))

  return (
    <aside
      className={`${collapsed ? 'w-16' : 'w-64'} bg-secondary text-white flex flex-col transition-all duration-200 ease-in-out`}
    >
      <div className="h-14 flex items-center justify-center border-b border-white/10">
        {!collapsed && <span className="text-lg font-bold tracking-wide">STAR STORE</span>}
        {collapsed && <span className="text-lg font-bold">SS</span>}
      </div>

      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
        {visible.map((item, idx) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-all animate-slide-in-right ${
                isActive ? 'bg-primary text-white shadow-lg shadow-primary/30' : 'text-slate-300 hover:bg-white/10 hover:text-white'
              }`
            }
            style={{ animationDelay: `${idx * 30}ms`, animationFillMode: 'both' }}
          >
            <item.icon className="h-4 w-4" />
            {!collapsed && <span>{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      {!collapsed && (
        <div className="p-3 border-t border-white/10">
          <p className="text-[11px] text-slate-400 text-center">STAR STORE MANAGER v1.0</p>
        </div>
      )}
    </aside>
  )
}