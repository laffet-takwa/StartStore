import { useState, useEffect } from 'react'
import { Menu, Search, Bell, ChevronDown, LogOut, User } from 'lucide-react'
import { useAuth } from '@/context/auth-context'
import { notificationsApi } from '@/api/dashboard.api'
import type { Notification } from '@/types'
import { Link } from 'react-router-dom'

export function TopNavbar({ onToggleSidebar }: { onToggleSidebar: () => void }) {
  const { user, logout } = useAuth()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [showDropdown, setShowDropdown] = useState(false)

  useEffect(() => {
    notificationsApi
      .list({ page_size: 5 })
      .then((res) => setNotifications(res.results))
      .catch(() => {})
  }, [])

  const unreadCount = notifications.filter((n) => !n.is_read).length

  return (
    <header className="h-14 bg-surface border-b border-slate-200 flex items-center justify-between px-4">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="p-2 rounded-md hover:bg-slate-100 lg:hidden"
        >
          <Menu className="h-5 w-5 text-slate-700" />
        </button>
        <div className="hidden md:flex items-center gap-2 text-sm text-muted">
          <span>STAR STORE</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="hidden md:flex relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted" />
          <input
            type="text"
            placeholder="Search..."
            className="pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary w-64"
          />
        </div>

        <Link
          to="/notifications"
          className="relative p-2 rounded-md hover:bg-slate-100"
        >
          <Bell className="h-5 w-5 text-slate-700" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 h-4 w-4 rounded-full bg-danger text-white text-[10px] font-bold flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Link>

        <div className="relative">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center gap-2 p-1.5 rounded-md hover:bg-slate-100"
          >
            <div className="h-8 w-8 rounded-full bg-primary text-white flex items-center justify-center text-sm font-semibold">
              {user?.first_name?.[0]}{user?.last_name?.[0]}
            </div>
            <div className="hidden md:block text-left">
              <p className="text-sm font-medium text-slate-900">
                {user?.first_name} {user?.last_name}
              </p>
              <p className="text-xs text-muted capitalize">{user?.role_display}</p>
            </div>
            <ChevronDown className="h-4 w-4 text-muted hidden md:block" />
          </button>

          {showDropdown && (
            <div className="absolute right-0 mt-2 w-48 bg-surface rounded-md shadow-lg border border-slate-200 py-1 z-50">
              <Link
                to="/profile"
                className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
              >
                <User className="h-4 w-4" />
                Profile
              </Link>
              <button
                onClick={logout}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-danger hover:bg-slate-50"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}