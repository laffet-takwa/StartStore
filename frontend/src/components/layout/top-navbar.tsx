import { useState, useEffect } from 'react'
import { Menu, Search, Bell, ChevronDown, LogOut, User, Sun, Moon, Monitor } from 'lucide-react'
import { useAuth } from '@/context/auth-context'
import { notificationsApi } from '@/api/dashboard.api'
import { useTheme } from '@/context/theme-context'
import type { Notification } from '@/types'
import { Link } from 'react-router-dom'
import logo from '/images/logo.jpg'

export function TopNavbar({ onToggleSidebar }: { onToggleSidebar: () => void }) {
  const { user, logout } = useAuth()
  const { resolved, setTheme, theme } = useTheme()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [showDropdown, setShowDropdown] = useState(false)
  const [themeOpen, setThemeOpen] = useState(false)

  useEffect(() => {
    notificationsApi
      .list({ page_size: 5 })
      .then((res) => setNotifications(res.results))
      .catch(() => {})
  }, [])

  const unreadCount = notifications.filter((n) => !n.is_read).length

  const ThemeIcon = theme === 'light' ? Sun : theme === 'dark' ? Moon : Monitor

  return (
    <header className="h-14 bg-surface border-b border-slate-200 flex items-center justify-between px-4 animate-slide-up">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="p-2 rounded-md hover:bg-slate-100 lg:hidden transition-colors"
        >
          <Menu className="h-5 w-5 text-slate-700" />
        </button>
        <div className="hidden md:flex items-center gap-2 text-sm text-muted">
          <img src={logo} alt="STAR STORE" className="h-7 w-auto" />
          <span>STAR STORE</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="hidden md:flex relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted" />
          <input
            type="text"
            placeholder="Search..."
            className="pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary w-64 transition-all"
          />
        </div>

        <div className="relative">
          <button
            onClick={() => setThemeOpen((v) => !v)}
            className="p-2 rounded-md hover:bg-slate-100 transition-colors"
            aria-label="Toggle theme"
          >
            <ThemeIcon className="h-4 w-4 text-slate-700" />
          </button>
          {themeOpen && (
            <div className="absolute right-0 mt-2 w-36 bg-surface rounded-md shadow-lg border border-slate-200 py-1 z-50 animate-scale-in">
              {(['light', 'dark', 'system'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => { setTheme(t); setThemeOpen(false) }}
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-slate-50 ${theme === t ? 'text-primary font-medium' : 'text-slate-700'}`}
                >
                  {t === 'light' ? 'Light' : t === 'dark' ? 'Dark' : 'System'} {resolved === t ? `(${t})` : ''}
                </button>
              ))}
            </div>
          )}
        </div>

        <Link
          to="/notifications"
          className="relative p-2 rounded-md hover:bg-slate-100 transition-colors"
        >
          <Bell className="h-5 w-5 text-slate-700" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 h-4 w-4 rounded-full bg-danger text-white text-[10px] font-bold flex items-center justify-center animate-pulse-soft">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Link>

        <div className="relative">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center gap-2 p-1.5 rounded-md hover:bg-slate-100 transition-colors"
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
            <div className="absolute right-0 mt-2 w-48 bg-surface rounded-md shadow-lg border border-slate-200 py-1 z-50 animate-scale-in">
              <Link
                to="/profile"
                className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <User className="h-4 w-4" />
                Profile
              </Link>
              <button
                onClick={logout}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-danger hover:bg-slate-50 transition-colors"
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