import { useState, useEffect } from 'react'
import { Menu, Search, ChevronDown, LogOut, User, Sun, Moon, Monitor } from 'lucide-react'
import { useAuth } from '@/context/auth-context'
import { useTheme } from '@/context/theme-context'
import { useI18n } from '@/i18n/context'
import { Link } from 'react-router-dom'
import { CommandPalette } from '@/components/common/command-palette'
import { NotificationCenter } from '@/components/common/notification-center'
import { cn } from '@/utils/cn'

export function TopNavbar({ onToggleSidebar }: { onToggleSidebar: () => void }) {
  const { user, logout } = useAuth()
  const { resolved, setTheme, theme } = useTheme()
  const { t } = useI18n()
  const [themeOpen, setThemeOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)

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

  const ThemeIcon = theme === 'light' ? Sun : theme === 'dark' ? Moon : Monitor

  return (
    <>
      <header className={cn('h-14 bg-white/80 dark:bg-dark-surface/80 backdrop-blur-sm border-b border-slate-200 dark:border-dark-border flex items-center justify-between px-4 z-40')}>
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebar}
            className={cn('p-2 rounded-lg transition-colors lg:hidden', 'hover:bg-slate-100 dark:hover:bg-dark-surface-secondary')}
            aria-label="Toggle sidebar"
          >
            <Menu className="h-5 w-5 text-slate-500 dark:text-slate-400" />
          </button>
          <div className="hidden md:flex items-center gap-2">
            <span className="text-sm font-semibold text-slate-900 dark:text-slate-50">STAR STORE</span>
            <span className="text-slate-400 dark:text-slate-600">/</span>
            <span className="text-sm text-slate-500 dark:text-slate-400">{t('dashboard.title')}</span>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setSearchOpen(true)}
            className={cn(
              'hidden md:flex items-center gap-2.5 px-3 py-2 text-sm rounded-lg transition-all border border-slate-200 dark:border-slate-700 hover:border-primary/30 dark:hover:border-primary/40 hover:bg-slate-50 dark:hover:bg-dark-surface-secondary min-w-[200px]'
            )}
          >
            <Search className="h-4 w-4 text-muted" />
            <span className="text-muted flex-1 text-left">{t('common.search')}</span>
            <kbd className={cn('rounded border px-1.5 py-0.5 text-[10px] font-mono text-muted border-slate-200 dark:border-slate-700')}>
              ⌘K
            </kbd>
          </button>

          <button
            onClick={() => setSearchOpen(true)}
            className={cn('md:hidden p-2 rounded-lg transition-colors', 'hover:bg-slate-100 dark:hover:bg-dark-surface-secondary')}
            aria-label="Search"
          >
            <Search className="h-5 w-5 text-slate-500 dark:text-slate-400" />
          </button>

          {/* Theme Toggle */}
          <div className="relative">
            <button
              onClick={() => setThemeOpen((v) => !v)}
              className={cn('p-2 rounded-lg transition-colors', 'hover:bg-slate-100 dark:hover:bg-dark-surface-secondary')}
              aria-label="Toggle theme"
            >
              <ThemeIcon className="h-[18px] w-[18px] text-slate-500 dark:text-slate-400" />
            </button>
            {themeOpen && (
              <div
                className={cn(
                  'absolute right-0 mt-1.5 w-40 rounded-xl shadow-lg border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-surface z-50 animate-scale-in py-1'
                )}
              >
                {(['light', 'dark', 'system'] as const).map((themeKey) => (
                  <button
                    key={themeKey}
                    onClick={() => { setTheme(themeKey); setThemeOpen(false) }}
                    className={cn(
                      'w-full text-left px-3 py-2.5 text-sm transition-colors flex items-center justify-between',
                      theme === themeKey ? 'text-primary font-medium bg-primary-50 dark:bg-dark-primary-light' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-dark-surface-secondary'
                    )}
                  >
                    <span>{themeKey === 'light' ? t('settings.light') : themeKey === 'dark' ? t('settings.dark') : t('settings.system')}</span>
                    {resolved === themeKey && <span className="text-xs text-primary">({themeKey})</span>}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Notifications */}
          <NotificationCenter />

          {/* Profile */}
          <div className="relative">
            <button
              onClick={() => setProfileOpen((v) => !v)}
              className={cn('flex items-center gap-2 p-1.5 rounded-lg transition-colors', 'hover:bg-slate-100 dark:hover:bg-dark-surface-secondary')}
            >
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary to-primary-hover text-white flex items-center justify-center text-sm font-semibold shadow-sm">
                {user?.first_name?.[0]}{user?.last_name?.[0]}
              </div>
              <div className="hidden md:block text-left">
                <p className="text-sm font-medium text-slate-900 dark:text-slate-50 leading-tight">
                  {user?.first_name} {user?.last_name}
                </p>
                <p className="text-xs text-muted dark:text-slate-500 capitalize leading-tight">{user?.role_display}</p>
              </div>
              <ChevronDown className="h-4 w-4 text-muted hidden md:block" />
            </button>

            {profileOpen && (
              <div
                className={cn(
                  'absolute right-0 mt-1.5 w-52 rounded-xl shadow-lg border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-surface z-50 animate-scale-in py-1 overflow-hidden'
                )}
              >
                <div className="px-3 py-2.5 border-b border-slate-100 dark:border-slate-700/50">
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-50">{user?.first_name} {user?.last_name}</p>
                  <p className="text-xs text-muted dark:text-slate-500">{user?.email}</p>
                </div>
                 <Link
                  to="/settings"
                  onClick={() => setProfileOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2.5 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-dark-surface-secondary transition-colors"
                >
                  <User className="h-4 w-4 text-slate-400" />
                  {t('navigation.profile')}
                </Link>
                <button
                  onClick={() => { logout(); setProfileOpen(false) }}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-danger hover:bg-danger-50 dark:hover:bg-dark-danger-light transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  {t('auth.logout')}
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
