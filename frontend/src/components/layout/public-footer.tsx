import { Link } from 'react-router-dom'
import { Mail, Phone, MapPin } from 'lucide-react'
import { LOGO_IMAGE } from '@/utils/images'
import { useI18n } from '@/i18n/context'

export function PublicFooter() {
  const { t } = useI18n()

  return (
    <footer className="bg-surface border-t border-base">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <Link to="/" className="flex items-center gap-2 mb-4">
              <img src={LOGO_IMAGE} alt="STAR STORE" className="h-9 w-9 rounded-lg object-contain" />
              <span className="text-lg font-bold text-base tracking-tight">STAR STORE</span>
            </Link>
            <p className="text-sm text-muted">
              {t('navigation.shop')} · {t('navigation.services')} · {t('navigation.repairs')}
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-base mb-4">{t('navigation.shop')}</h3>
            <ul className="space-y-2">
              <li><Link to="/shop" className="text-sm text-muted hover:text-base transition-colors">{t('shop.allCategories')}</Link></li>
              <li><Link to="/categories" className="text-sm text-muted hover:text-base transition-colors">{t('navigation.categories')}</Link></li>
              <li><Link to="/services" className="text-sm text-muted hover:text-base transition-colors">{t('navigation.services')}</Link></li>
              <li><Link to="/repairs" className="text-sm text-muted hover:text-base transition-colors">{t('navigation.repairs')}</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-base mb-4">{t('navigation.help')}</h3>
            <ul className="space-y-2">
              <li><Link to="/track" className="text-sm text-muted hover:text-base transition-colors">{t('navigation.track')}</Link></li>
              <li><Link to="/contact" className="text-sm text-muted hover:text-base transition-colors">{t('navigation.contact')}</Link></li>
              <li><Link to="/faq" className="text-sm text-muted hover:text-base transition-colors">FAQ</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-base mb-4">{t('navigation.contact')}</h3>
            <ul className="space-y-3">
              <li className="flex items-center gap-2 text-sm text-muted">
                <MapPin className="h-4 w-4" />
                Tunis, Tunisia
              </li>
              <li className="flex items-center gap-2 text-sm text-muted">
                <Phone className="h-4 w-4" />
                +216 XX XXX XXX
              </li>
              <li className="flex items-center gap-2 text-sm text-muted">
                <Mail className="h-4 w-4" />
                contact@starstore.tn
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-base">
          <p className="text-sm text-muted text-center">
            © {new Date().getFullYear()} STAR STORE. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
