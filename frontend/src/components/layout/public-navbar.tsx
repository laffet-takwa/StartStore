import { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X, Search, ShoppingCart, User, Globe, Sun, Moon, Monitor, Command } from 'lucide-react'
import { useAuth } from '@/context/auth-context'
import { useTheme } from '@/context/theme-context'
import { useI18n } from '@/i18n/context'
import { LANGUAGES } from '@/i18n/index'
import { Button } from '@/components/ui'
import { LOGO_IMAGE } from '@/utils/images'
import { cn } from '@/utils/cn'

export function Navbar() {
  const [open, setOpen] = useState(false)
  const [langMenuOpen, setLangMenuOpen] = useState(false)
  const [searchFocused, setSearchFocused] = useState(false)
  const { user } = useAuth()
  const { theme, setTheme } = useTheme()
  const { language, setLanguage, t } = useI18n()
  const langRef = useRef<HTMLDivElement>(null)

  const currentLang = LANGUAGES.find((l: { code: string }) => l.code === language)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (langRef.current && !langRef.current.contains(e.target as Node)) {
        setLangMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <header className="sticky top-0 z-50 bg-surface/80 backdrop-blur-md border-b border-base">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2.5">
            <img src={LOGO_IMAGE} alt="STAR STORE" className="h-9 w-9 rounded-lg object-contain" />
            <span className="text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight">STAR STORE</span>
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            <Link to="/" className="text-sm font-medium text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-100 transition-colors">{t('navigation.home')}</Link>
            <Link to="/shop" className="text-sm font-medium text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-100 transition-colors">{t('navigation.shop')}</Link>
            <Link to="/categories" className="text-sm font-medium text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-100 transition-colors">{t('navigation.categories')}</Link>
            <Link to="/services" className="text-sm font-medium text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-100 transition-colors">{t('navigation.services')}</Link>
            <Link to="/repairs" className="text-sm font-medium text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-100 transition-colors">{t('navigation.repairs')}</Link>
            <Link to="/contact" className="text-sm font-medium text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-100 transition-colors">{t('navigation.contact')}</Link>
            <Link to="/track" className="text-sm font-medium text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-100 transition-colors">{t('navigation.track')}</Link>
          </nav>

          <div className="flex items-center gap-1">
            <div className="hidden md:flex items-center gap-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 dark:text-slate-400" />
                <input
                  type="text"
                  placeholder={t('common.search')}
                  onFocus={() => setSearchFocused(true)}
                  onBlur={() => setSearchFocused(false)}
                  className={cn(
                    'w-48 pl-9 pr-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 bg-transparent transition-all text-slate-900 dark:text-slate-100',
                    searchFocused ? 'w-64 border-primary/30' : 'border-transparent hover:border-slate-200'
                  )}
                />
                <kbd className="absolute right-2 top-1/2 -translate-y-1/2 hidden lg:inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 rounded border border-slate-200 dark:border-slate-600">
                  <Command className="h-3 w-3" />K
                </kbd>
              </div>
            </div>

            <div className="hidden md:flex items-center gap-0.5">
              <button
                onClick={() => setTheme(theme === 'light' ? 'dark' : theme === 'dark' ? 'system' : 'light')}
                className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-700 dark:text-slate-300"
                aria-label="Toggle theme"
              >
                {theme === 'light' && <Sun className="h-4 w-4" />}
                {theme === 'dark' && <Moon className="h-4 w-4" />}
                {theme === 'system' && <Monitor className="h-4 w-4" />}
              </button>

              <div className="relative" ref={langRef}>
                <button
                  onClick={() => setLangMenuOpen(!langMenuOpen)}
                  className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-700 dark:text-slate-300 flex items-center gap-1"
                  aria-label="Change language"
                >
                  <Globe className="h-4 w-4" />
                  <span className="text-xs font-medium text-slate-700 dark:text-slate-300">{currentLang?.code.toUpperCase()}</span>
                </button>
                <AnimatePresence>
                  {langMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 top-full mt-1 w-40 bg-surface border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg py-1.5 z-50"
                    >
                       {LANGUAGES.map((lang: { code: string; native: string }) => (
                         <button
                           key={lang.code}
                           onClick={() => { setLanguage(lang.code as 'ar' | 'fr' | 'en'); setLangMenuOpen(false) }}
                           className={cn(
                             'w-full text-left px-3 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-2',
                             language === lang.code ? 'text-primary font-medium' : 'text-slate-800 dark:text-slate-200'
                           )}
                         >
                           <span>{lang.code === 'ar' ? '🇹🇳' : lang.code === 'fr' ? '🇫🇷' : '🇬🇧'}</span>
                           {lang.native}
                         </button>
                       ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            <Link to="/cart" className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors relative">
              <ShoppingCart className="h-5 w-5 text-slate-700 dark:text-slate-300" />
            </Link>
            {user ? (
              <Link to="/portal" className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                <User className="h-5 w-5 text-slate-700 dark:text-slate-300" />
              </Link>
            ) : (
              <Link to="/login">
                <Button size="sm">{t('auth.login')}</Button>
              </Link>
            )}
            <button onClick={() => setOpen(!open)} className="md:hidden p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-700 dark:text-slate-300" aria-label="Toggle menu">
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="md:hidden overflow-hidden border-t border-slate-100 dark:border-slate-800"
            >
              <nav className="flex flex-col gap-1 py-3">
                <Link to="/" className="text-sm font-medium text-slate-800 hover:text-slate-900 dark:text-slate-200 dark:hover:text-slate-100 px-2 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800" onClick={() => setOpen(false)}>{t('navigation.home')}</Link>
                <Link to="/shop" className="text-sm font-medium text-slate-800 hover:text-slate-900 dark:text-slate-200 dark:hover:text-slate-100 px-2 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800" onClick={() => setOpen(false)}>{t('navigation.shop')}</Link>
                <Link to="/categories" className="text-sm font-medium text-slate-800 hover:text-slate-900 dark:text-slate-200 dark:hover:text-slate-100 px-2 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800" onClick={() => setOpen(false)}>{t('navigation.categories')}</Link>
                <Link to="/services" className="text-sm font-medium text-slate-800 hover:text-slate-900 dark:text-slate-200 dark:hover:text-slate-100 px-2 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800" onClick={() => setOpen(false)}>{t('navigation.services')}</Link>
                <Link to="/repairs" className="text-sm font-medium text-slate-800 hover:text-slate-900 dark:text-slate-200 dark:hover:text-slate-100 px-2 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800" onClick={() => setOpen(false)}>{t('navigation.repairs')}</Link>
                <Link to="/contact" className="text-sm font-medium text-slate-800 hover:text-slate-900 dark:text-slate-200 dark:hover:text-slate-100 px-2 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800" onClick={() => setOpen(false)}>{t('navigation.contact')}</Link>
                <Link to="/track" className="text-sm font-medium text-slate-800 hover:text-slate-900 dark:text-slate-200 dark:hover:text-slate-100 px-2 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800" onClick={() => setOpen(false)}>{t('navigation.track')}</Link>
                <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 mt-1">
                  <button
                    onClick={() => setTheme(theme === 'light' ? 'dark' : theme === 'dark' ? 'system' : 'light')}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    {theme === 'light' && <Sun className="h-4 w-4" />}
                    {theme === 'dark' && <Moon className="h-4 w-4" />}
                    {theme === 'system' && <Monitor className="h-4 w-4" />}
                    {t('settings.theme')}
                  </button>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value as 'ar' | 'fr' | 'en')}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800"
                  >
                    {LANGUAGES.map((lang) => (
                      <option key={lang.code} value={lang.code}>{lang.native}</option>
                    ))}
                  </select>
                </div>
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  )
}
