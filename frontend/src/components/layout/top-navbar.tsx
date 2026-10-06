import { useState, useEffect } from 'react'
import { Menu, Search, Bell, ChevronDown, LogOut, User, Sun, Moon, Monitor } from 'lucide-react'
import { useAuth } from '@/context/auth-context'
import { notificationsApi } from '@/api/dashboard.api'
import { useTheme } from '@/context/theme-context'
import type { Notification } from '@/types'
import { Link } from 'react-router-dom'
import { CommandPalette } from '@/components/common/command-palette'
import { cn } from '@/utils/cn'

export function TopNavbar({ onToggleSidebar }: { onToggleSidebar: () => void }) {
  const { user, logout } = useAuth()
  const { resolved, setTheme, theme } = useTheme()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [showDropdown, setShowDropdown] = useState(false)
  const [themeOpen, setThemeOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)

  useEffect(() => {
    notificationsApi
      .list({ page_size: 5 })
      .then((res) => setNotifications(res.results))
      .catch(() => {})
  }, [])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setSearchOpen((v) => !v)
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [])

  const unreadCount = notifications.filter((n) => !n.is_read).length

  const ThemeIcon = theme === 'light' ? Sun : theme === 'dark' ? Moon : Monitor

  return (
    <>
      <header className={cn('h-14 bg-surface border-b border-base flex items-center justify-between px-4 animate-slide-up')}>
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebar}
            className={cn('p-2 rounded-md lg:hidden transition-colors', 'hover:bg-surface-secondary dark:hover:bg-dark-surface-secondary')}
          >
            <Menu className="h-5 w-5 text-muted-base" />
          </button>
          <div className="hidden md:flex items-center gap-2 text-sm text-muted-base">
            <span>STAR STORE</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setSearchOpen(true)}
            className={cn('md:hidden p-2 rounded-md transition-colors', 'hover:bg-surface-secondary dark:hover:bg-dark-surface-secondary')}
            aria-label="Search"
          >
            <Search className="h-5 w-5 text-muted-base" />
          </button>

          <button
            onClick={() => setSearchOpen(true)}
            className={cn(
              'hidden md:flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors w-64',
              'border-base hover:bg-surface-secondary dark:hover:bg-dark-surface-secondary'
            )}
          >
            <Search className="h-4 w-4 text-muted-base" />
            <span className="text-muted-base">Search...</span>
            <kbd className={cn('ml-auto rounded border px-1.5 py-0.5 text-[10px] text-muted', 'border-base')}>
              ⌘K
            </kbd>
          </button>

          <div className="relative">
            <button
              onClick={() => setThemeOpen((v) => !v)}
              className={cn('p-2 rounded-md transition-colors', 'hover:bg-surface-secondary dark:hover:bg-dark-surface-secondary')}
              aria-label="Toggle theme"
            >
              <ThemeIcon className="h-4 w-4 text-muted-base" />
            </button>
            {themeOpen && (
              <div className={cn(
                'absolute right-0 mt-2 w-36 rounded-md shadow-lg py-1 z-50 animate-scale-in',
                'bg-surface border border-base dark:bg-dark-surface dark:border-dark-border'
              )}>
                {(['light', 'dark', 'system'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => { setTheme(t); setThemeOpen(false) }}
                    className={cn(
                      'w-full text-left px-3 py-2 text-sm',
                      theme === t ? 'text-primary font-medium' : 'text-muted-base hover:bg-surface-secondary dark:hover:bg-dark-surface-secondary'
                    )}
                  >
                    {t === 'light' ? 'Light' : t === 'dark' ? 'Dark' : 'System'} {resolved === t ? `(${t})` : ''}
                  </button>
                ))}
              </div>
            )}
          </div>

          <Link
            to="/notifications"
            className={cn('relative p-2 rounded-md transition-colors', 'hover:bg-surface-secondary dark:hover:bg-dark-surface-secondary')}
          >
            <Bell className="h-5 w-5 text-muted-base" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 h-4 w-4 rounded-full bg-danger text-white text-[10px] font-bold flex items-center justify-center animate-pulse-soft">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </Link>

          <div className="relative">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className={cn('flex items-center gap-2 p-1.5 rounded-md transition-colors', 'hover:bg-surface-secondary dark:hover:bg-dark-surface-secondary')}
            >
              <div className="h-8 w-8 rounded-full bg-primary text-white flex items-center justify-center text-sm font-semibold">
                {user?.first_name?.[0]}{user?.last_name?.[0]}
              </div>
              <div className="hidden md:block text-left">
                <p className="text-sm font-medium text-base">
                  {user?.first_name} {user?.last_name}
                </p>
                <p className="text-xs text-muted-base capitalize">{user?.role_display}</p>
              </div>
              <ChevronDown className="h-4 w-4 text-muted hidden md:block" />
            </button>

            {showDropdown && (
              <div className={cn(
                'absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 z-50 animate-scale-in',
                'bg-surface border border-base dark:bg-dark-surface dark:border-dark-border'
              )}>
                <Link
                  to="/profile"
                  className={cn('flex items-center gap-2 px-4 py-2 text-sm transition-colors', 'text-muted-base hover:bg-surface-secondary dark:hover:bg-dark-surface-secondary')}
                >
                  <User className="h-4 w-4" />
                  Profile
                </Link>
                <button
                  onClick={logout}
                  className={cn('w-full flex items-center gap-2 px-4 py-2 text-sm transition-colors', 'text-danger hover:bg-surface-secondary dark:hover:bg-dark-surface-secondary')}
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <CommandPalette open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  )
}
