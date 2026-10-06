import { Link } from 'react-router-dom'
import { Store, Mail, Phone, MapPin } from 'lucide-react'

export function Footer() {
  return (
    <footer className="bg-surface border-t border-base">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="h-9 w-9 rounded-lg brand-gradient text-white flex items-center justify-center">
                <Store className="h-5 w-5" />
              </div>
              <span className="text-lg font-bold text-base">STAR STORE</span>
            </Link>
            <p className="text-sm text-muted">
              Expert IT services, computer sales, repairs, and robotics in Tunisia.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-base mb-4">Shop</h3>
            <ul className="space-y-2">
              <li><Link to="/shop" className="text-sm text-muted hover:text-base transition-colors">All Products</Link></li>
              <li><Link to="/categories" className="text-sm text-muted hover:text-base transition-colors">Categories</Link></li>
              <li><Link to="/services" className="text-sm text-muted hover:text-base transition-colors">Services</Link></li>
              <li><Link to="/repairs" className="text-sm text-muted hover:text-base transition-colors">Repairs</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-base mb-4">Support</h3>
            <ul className="space-y-2">
              <li><Link to="/track" className="text-sm text-muted hover:text-base transition-colors">Track Repair</Link></li>
              <li><Link to="/track" className="text-sm text-muted hover:text-base transition-colors">Track Order</Link></li>
              <li><Link to="/contact" className="text-sm text-muted hover:text-base transition-colors">Contact</Link></li>
              <li><Link to="/faq" className="text-sm text-muted hover:text-base transition-colors">FAQ</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-base mb-4">Contact</h3>
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
