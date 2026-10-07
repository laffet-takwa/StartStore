import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Menu, X, Search, ShoppingCart, User, Globe, Sun, Moon, Monitor } from 'lucide-react'
import { useAuth } from '@/context/auth-context'
import { useTheme } from '@/context/theme-context'
import { useI18n } from '@/i18n/context'
import { LANGUAGES } from '@/i18n/index'
import { Button } from '@/components/ui'
import { LOGO_IMAGE } from '@/utils/images'

export function Navbar() {
  const [open, setOpen] = useState(false)
  const { user } = useAuth()
  const { theme, setTheme } = useTheme()
  const { language, setLanguage, t } = useI18n()
  const [langMenuOpen, setLangMenuOpen] = useState(false)

  const currentLang = LANGUAGES.find((l: { code: string }) => l.code === language)

  return (
    <header className="sticky top-0 z-50 bg-surface/80 backdrop-blur border-b border-base">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2.5">
            <img src={LOGO_IMAGE} alt="STAR STORE" className="h-9 w-9 rounded-lg object-contain" />
            <span className="text-lg font-bold text-base tracking-tight">STAR STORE</span>
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            <Link to="/" className="text-sm font-medium text-muted hover:text-base transition-colors">{t('navigation.home')}</Link>
            <Link to="/shop" className="text-sm font-medium text-muted hover:text-base transition-colors">{t('navigation.shop')}</Link>
            <Link to="/categories" className="text-sm font-medium text-muted hover:text-base transition-colors">{t('navigation.categories')}</Link>
            <Link to="/services" className="text-sm font-medium text-muted hover:text-base transition-colors">{t('navigation.services')}</Link>
            <Link to="/repairs" className="text-sm font-medium text-muted hover:text-base transition-colors">{t('navigation.repairs')}</Link>
            <Link to="/contact" className="text-sm font-medium text-muted hover:text-base transition-colors">{t('navigation.contact')}</Link>
            <Link to="/track" className="text-sm font-medium text-muted hover:text-base transition-colors">{t('navigation.track')}</Link>
          </nav>

          <div className="flex items-center gap-2">
            <div className="hidden md:flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
                 <input
                   type="text"
                   placeholder={t('common.search')}
                   className="w-64 pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 bg-white dark:bg-dark-surface dark:border-slate-700 dark:text-slate-100"
                 />
              </div>
            </div>

            <div className="hidden md:flex items-center gap-1">
              <button
                onClick={() => setTheme(theme === 'light' ? 'dark' : theme === 'dark' ? 'system' : 'light')}
                className="p-2 rounded-md hover:bg-surface-secondary transition-colors text-muted"
                title="Toggle theme"
              >
                {theme === 'light' && <Sun className="h-4 w-4" />}
                {theme === 'dark' && <Moon className="h-4 w-4" />}
                {theme === 'system' && <Monitor className="h-4 w-4" />}
              </button>

              <div className="relative">
                <button
                  onClick={() => setLangMenuOpen(!langMenuOpen)}
                  className="p-2 rounded-md hover:bg-surface-secondary transition-colors text-muted flex items-center gap-1"
                  title="Change language"
                >
                  <Globe className="h-4 w-4" />
                  <span className="text-xs font-medium">{currentLang?.code.toUpperCase()}</span>
                </button>
                {langMenuOpen && (
                  <div className="absolute right-0 top-full mt-1 w-40 bg-surface border border-base rounded-lg shadow-lg py-1 z-50">
                    {LANGUAGES.map((lang: { code: string; native: string }) => (
                      <button
                        key={lang.code}
                        onClick={() => { setLanguage(lang.code as 'ar' | 'fr' | 'en'); setLangMenuOpen(false) }}
                        className={`w-full text-left px-3 py-2 text-sm hover:bg-surface-secondary transition-colors flex items-center gap-2 ${language === lang.code ? 'text-primary font-medium' : 'text-slate-700 dark:text-slate-200'}`}
                      >
                        <span>{lang.code === 'ar' ? '🇹🇳' : lang.code === 'fr' ? '🇫🇷' : '🇬🇧'}</span>
                        {lang.native}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <Link to="/cart" className="p-2 rounded-md hover:bg-surface-secondary transition-colors relative">
              <ShoppingCart className="h-5 w-5 text-muted" />
            </Link>
            {user ? (
              <Link to="/portal" className="p-2 rounded-md hover:bg-surface-secondary transition-colors">
                <User className="h-5 w-5 text-muted" />
              </Link>
            ) : (
              <Link to="/login">
                <Button size="sm">{t('auth.login')}</Button>
              </Link>
            )}
            <button onClick={() => setOpen(!open)} className="md:hidden p-2 rounded-md hover:bg-surface-secondary transition-colors">
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {open && (
          <div className="md:hidden py-4 border-t border-base animate-slide-down">
            <nav className="flex flex-col gap-3">
              <Link to="/" className="text-sm font-medium text-muted hover:text-base" onClick={() => setOpen(false)}>{t('navigation.home')}</Link>
              <Link to="/shop" className="text-sm font-medium text-muted hover:text-base" onClick={() => setOpen(false)}>{t('navigation.shop')}</Link>
              <Link to="/categories" className="text-sm font-medium text-muted hover:text-base" onClick={() => setOpen(false)}>{t('navigation.categories')}</Link>
              <Link to="/services" className="text-sm font-medium text-muted hover:text-base" onClick={() => setOpen(false)}>{t('navigation.services')}</Link>
              <Link to="/repairs" className="text-sm font-medium text-muted hover:text-base" onClick={() => setOpen(false)}>{t('navigation.repairs')}</Link>
              <Link to="/contact" className="text-sm font-medium text-muted hover:text-base" onClick={() => setOpen(false)}>{t('navigation.contact')}</Link>
              <Link to="/track" className="text-sm font-medium text-muted hover:text-base" onClick={() => setOpen(false)}>{t('navigation.track')}</Link>
              <div className="flex items-center gap-2 pt-2 border-t border-base">
                <button
                  onClick={() => setTheme(theme === 'light' ? 'dark' : theme === 'dark' ? 'system' : 'light')}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-muted border border-base rounded-lg"
                >
                  {theme === 'light' && <Sun className="h-4 w-4" />}
                  {theme === 'dark' && <Moon className="h-4 w-4" />}
                  {theme === 'system' && <Monitor className="h-4 w-4" />}
                  {t('settings.theme')}
                </button>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value as 'ar' | 'fr' | 'en')}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-muted border border-base rounded-lg bg-white dark:bg-dark-surface"
                >
                  {LANGUAGES.map((lang) => (
                    <option key={lang.code} value={lang.code}>{lang.native}</option>
                  ))}
                </select>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}
