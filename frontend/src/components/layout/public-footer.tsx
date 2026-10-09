import { Link } from 'react-router-dom'
import { Mail, Phone, MapPin } from 'lucide-react'
import { LOGO_IMAGE } from '@/utils/images'
import { useI18n } from '@/i18n/context'

export function PublicFooter() {
  const { t } = useI18n()

  return (
    <footer className="bg-surface border-t border-base">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="col-span-2 md:col-span-1">
            <Link to="/" className="flex items-center gap-2.5 mb-4">
              <img src={LOGO_IMAGE} alt="STAR STORE" className="h-9 w-9 rounded-lg object-contain" />
              <span className="text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight">STAR STORE</span>
            </Link>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              {t('shop.subtitle')}
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-4">{t('navigation.shop')}</h3>
            <ul className="space-y-2.5">
              <li><Link to="/shop" className="text-sm text-slate-500 dark:text-slate-400 hover:text-primary transition-colors">{t('shop.allCategories')}</Link></li>
              <li><Link to="/categories" className="text-sm text-slate-500 dark:text-slate-400 hover:text-primary transition-colors">{t('navigation.categories')}</Link></li>
              <li><Link to="/services" className="text-sm text-slate-500 dark:text-slate-400 hover:text-primary transition-colors">{t('navigation.services')}</Link></li>
              <li><Link to="/repairs" className="text-sm text-slate-500 dark:text-slate-400 hover:text-primary transition-colors">{t('navigation.repairs')}</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-4">{t('navigation.help')}</h3>
            <ul className="space-y-2.5">
              <li><Link to="/track" className="text-sm text-slate-500 dark:text-slate-400 hover:text-primary transition-colors">{t('navigation.track')}</Link></li>
              <li><Link to="/contact" className="text-sm text-slate-500 dark:text-slate-400 hover:text-primary transition-colors">{t('navigation.contact')}</Link></li>
              <li><Link to="/faq" className="text-sm text-slate-500 dark:text-slate-400 hover:text-primary transition-colors">FAQ</Link></li>
              <li><Link to="/privacy" className="text-sm text-slate-500 dark:text-slate-400 hover:text-primary transition-colors">Privacy</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-4">{t('navigation.contact')}</h3>
            <ul className="space-y-3">
              <li className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                <MapPin className="h-4 w-4 text-primary" />
                Tunis, Tunisia
              </li>
              <li className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                <Phone className="h-4 w-4 text-primary" />
                +216 XX XXX XXX
              </li>
              <li className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                <Mail className="h-4 w-4 text-primary" />
                contact@starstore.tn
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-base">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted dark:text-slate-500">
              © {new Date().getFullYear()} STAR STORE. All rights reserved.
            </p>
            <div className="flex items-center gap-6">
              <Link to="/privacy" className="text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">Privacy</Link>
              <Link to="/terms" className="text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">Terms</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
