import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Wrench, ShieldCheck, Truck, Headphones, Star, Search } from 'lucide-react'
import { publicProductsApi, publicCategoriesApi } from '@/api'
import { LOGO_IMAGE, resolveProductImage, resolveCategoryImage } from '@/utils/images'
import { useI18n } from '@/i18n/context'
import type { Product, Category } from '@/types'

const trustBadges = [
  { icon: ShieldCheck, labelKey: 'home.trustWarranty' },
  { icon: Truck, labelKey: 'home.trustDelivery' },
  { icon: Headphones, labelKey: 'home.trustSupport' },
  { icon: Star, labelKey: 'home.trustQuality' },
]

export default function PublicHomePage() {
  const { t } = useI18n()
  const { data: productsData, isLoading: productsLoading } = useQuery({
    queryKey: ['public-store-products', 8],
    queryFn: () => publicProductsApi.list({ page_size: 8 }),
  })
  const { data: categoriesData, isLoading: categoriesLoading } = useQuery({
    queryKey: ['public-store-categories', 6],
    queryFn: () => publicCategoriesApi.list({ page_size: 6 }),
  })

  const products = ((productsData as any)?.results || []) as Product[]
  const categories = ((categoriesData as any)?.results || []) as Category[]

  return (
    <div className="st">
      {/* HERO */}
      <section className="hero">
        <div>
          <h1 className="hf">{t('home.heroTitle')}</h1>
          <p>{t('home.heroSubtitle')}</p>
          <div className="row">
            <Link to="/shop" className="btn">{t('home.shopNow')}</Link>
            <Link to="/track" className="btn o">
              <Search size={16} /> {t('home.trackRepair')}
            </Link>
          </div>
          <div className="row" style={{ marginTop: 20, color: 'var(--mu)', fontSize: 13 }}>
            {trustBadges.map((b) => (
              <span key={b.labelKey} className="row" style={{ gap: 6 }}>
                <b.icon size={16} style={{ color: 'var(--ac)' }} /> {t(b.labelKey)}
              </span>
            ))}
          </div>
        </div>
        <div className="hl">
          <img src={LOGO_IMAGE} alt="STAR STORE" />
        </div>
      </section>

      {/* PROMO */}
      <section className="sec">
        <div className="promo">
          <div>
            <h2 className="hf">{t('home.promoTitle')}</h2>
            <p>{t('home.promoText')}</p>
          </div>
          <Link to="/track" className="btn">
            <Wrench size={16} /> {t('home.trackRepair')}
          </Link>
        </div>
      </section>

      {/* FEATURED PRODUCTS (real data) */}
      <section className="sec" id="sec-p">
        <div className="row" style={{ justifyContent: 'space-between', marginBottom: 16 }}>
          <h2 className="hf" style={{ fontSize: 22 }}>{t('home.featured')}</h2>
          <Link to="/shop" className="lk">{t('common.viewAll')}</Link>
        </div>
        <div className="g pgs">
          {productsLoading ? (
            Array.from({ length: 4 }).map((_, i) => <div className="cd sk" key={i} />)
          ) : products.length === 0 ? (
            <div className="em">{t('common.noResults')}</div>
          ) : (
            products.map((product) => {
              const out = product.stock_quantity <= 0
              return (
                <div className="cd" key={product.id}>
                  <Link to={`/product/${product.id}`}>
                    <div className="pt">
                      <img
                        src={resolveProductImage(product)}
                        alt={product.name}
                        loading="lazy"
                      />
                    </div>
                  </Link>
                  <b style={{ display: 'block', fontSize: 13, marginTop: 8 }}>{product.name}</b>
                  <div className="ln" style={{ border: 0 }}>
                    <span className="hf" style={{ fontSize: 17, fontWeight: 700 }}>
                      {product.selling_price.toLocaleString()} TND
                    </span>
                    <span className={`bd ${out ? 'er' : product.stock_quantity <= 5 ? 'wa' : 'ok'}`}>
                      {out ? t('shop.outOfStock') : t('shop.inStock')}
                    </span>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </section>

      {/* CATEGORIES (real data) */}
      <section className="sec">
        <div className="row" style={{ justifyContent: 'space-between', marginBottom: 16 }}>
          <h2 className="hf" style={{ fontSize: 22 }}>{t('categories.title')}</h2>
          <Link to="/categories" className="lk">{t('common.viewAll')}</Link>
        </div>
        <div className="g k">
          {categoriesLoading ? (
            Array.from({ length: 3 }).map((_, i) => <div className="cd sk" key={i} />)
          ) : categories.length === 0 ? (
            <div className="em">{t('common.noResults')}</div>
          ) : (
            categories.map((category) => (
              <Link to={`/categories/${category.slug}`} key={category.id} style={{ textDecoration: 'none' }}>
                <div className="cd" style={{ textAlign: 'center' }}>
                  <div>
                    <img src={resolveCategoryImage(category)} alt={category.name} loading="lazy" />
                  </div>
                  <b style={{ fontSize: 13 }}>{category.name}</b>
                  <p style={{ color: 'var(--mu)', fontSize: 12, marginTop: 2 }}>
                    {category.product_count} {t('common.items')}
                  </p>
                </div>
              </Link>
            ))
          )}
        </div>
      </section>
    </div>
  )
}
