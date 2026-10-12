import { Link } from 'react-router-dom'
import { Search, ShoppingCart, Sun, Moon } from 'lucide-react'
import { useAuth } from '@/context/auth-context'
import { useTheme } from '@/context/theme-context'
import { useI18n } from '@/i18n/context'
import { LANGUAGES } from '@/i18n/index'
import { LOGO_IMAGE } from '@/utils/images'
import { useCart } from '@/context/cart-context'

const links = [
  { to: '/', key: 'navigation.home' },
  { to: '/shop', key: 'navigation.shop' },
  { to: '/services', key: 'navigation.services' },
  { to: '/track', key: 'navigation.track' },
]

export function Navbar() {
  const { user } = useAuth()
  const { resolved, setTheme } = useTheme()
  const { language, setLanguage, t } = useI18n()
  const { count } = useCart()
  const dark = resolved === 'dark'

  return (
    <header id="sh">
      <Link to="/" aria-label="STAR STORE">
        <img src={LOGO_IMAGE} alt="STAR STORE" />
      </Link>

      <nav className="sn">
        {links.map((l) => (
          <Link key={l.to} to={l.to} className="lk2">
            {t(l.key)}
          </Link>
        ))}
      </nav>

      <span className="sp" />

      <label className="sr" style={{ maxWidth: 220 }}>
        <span className="si"><Search size={16} /></span>
        <input
          className="in"
          type="search"
          placeholder={t('common.search')}
          style={{ width: '100%' }}
        />
      </label>

      <select
        aria-label="Language"
        value={language}
        onChange={(e) => setLanguage(e.target.value as 'en' | 'fr' | 'ar')}
        style={{ width: 'auto' }}
      >
        {LANGUAGES.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.code === 'ar' ? 'العربية' : lang.code === 'fr' ? 'Français' : 'English'}
          </option>
        ))}
      </select>

      <button
        className="ic"
        aria-label="Theme"
        title={t('settings.theme')}
        onClick={() => setTheme(dark ? 'light' : 'dark')}
      >
        {dark ? <Sun size={18} /> : <Moon size={18} />}
      </button>

      <Link to="/cart" className="ic" aria-label="Cart">
        <span style={{ display: 'flex' }}><ShoppingCart size={18} /></span>
        {count > 0 && <span className="dot">{count}</span>}
      </Link>

      {user ? (
        <Link to="/portal" className="btn o">{t('navigation.account')}</Link>
      ) : (
        <>
          <Link to="/login" className="btn o">{t('auth.login')}</Link>
          <Link to="/signup" className="btn">{t('auth.register')}</Link>
        </>
      )}
    </header>
  )
}
