import { useState } from 'react'
import { Menu, Search, Sun, Moon, LogOut } from 'lucide-react'
import { useAuth } from '@/context/auth-context'
import { useTheme } from '@/context/theme-context'
import { useI18n } from '@/i18n/context'
import { useLocation } from 'react-router-dom'
import { CommandPalette } from '@/components/common/command-palette'
import { NotificationCenter } from '@/components/common/notification-center'

const TITLE_BY_PATH: Array<[RegExp, string]> = [
  [/^\/dashboard/, 'dashboard.title'],
  [/^\/repairs/, 'repairs.title'],
  [/^\/customers/, 'customers.title'],
  [/^\/devices/, 'devices.title'],
  [/^\/sales/, 'sales.title'],
  [/^\/products/, 'products.title'],
  [/^\/categories/, 'categories.title'],
  [/^\/suppliers/, 'suppliers.title'],
  [/^\/inventory/, 'inventory.title'],
  [/^\/payments/, 'payments.title'],
  [/^\/invoices/, 'invoices.title'],
  [/^\/reports/, 'reports.title'],
  [/^\/notifications/, 'notifications.title'],
  [/^\/audit-logs/, 'auditLogs.title'],
  [/^\/employees/, 'employees.title'],
  [/^\/settings/, 'settings.title'],
  [/^\/pos/, 'sales.newSale'],
  [/^\/portal/, 'portal.dashboard'],
]

export function TopNavbar({ onToggleSidebar }: { onToggleSidebar: () => void }) {
  const { logout } = useAuth()
  const { resolved, setTheme } = useTheme()
  const { t, language, setLanguage } = useI18n()
  const location = useLocation()
  const [searchOpen, setSearchOpen] = useState(false)

  const match = TITLE_BY_PATH.find(([re]) => re.test(location.pathname))
  const title = match ? t(match[1]) : 'STAR STORE'
  const dark = resolved === 'dark'

  return (
    <>
      <header className="top">
        <button className="ic" onClick={onToggleSidebar} aria-label="Toggle sidebar">
          <Menu size={20} />
        </button>

        <h1 className="hf">{title}</h1>

        <label className="sr" style={{ flex: 1, minWidth: 160, maxWidth: 360 }}>
          <span className="si">
            <Search size={16} />
          </span>
          <input
            className="in"
            type="search"
            style={{ width: '100%' }}
            placeholder={t('common.search')}
            onFocus={() => setSearchOpen(true)}
            readOnly
          />
        </label>

        <select
          aria-label="Language"
          value={language}
          onChange={(e) => setLanguage(e.target.value as 'en' | 'fr' | 'ar')}
          style={{ width: 'auto' }}
        >
          <option value="en">English</option>
          <option value="fr">Français</option>
          <option value="ar">العربية</option>
        </select>

        <button
          className="ic"
          aria-label="Theme"
          title={dark ? 'Light mode' : 'Dark mode'}
          onClick={() => setTheme(dark ? 'light' : 'dark')}
        >
          {dark ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        <span className="top-ic-slot">
          <NotificationCenter />
        </span>

        <button className="ic" aria-label={t('auth.logout')} title={t('auth.logout')} onClick={logout}>
          <LogOut size={18} />
        </button>
      </header>

      <CommandPalette open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  )
}
