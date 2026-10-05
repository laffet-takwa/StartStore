import { useMemo, useState } from 'react'

import { ProductImage, primaryImageOf } from './ProductCard'
import { Button } from '@/components/common/Button'
import { cn } from '@/lib/cn'
import type { ProductImage as ProductImageModel } from '@/types'

interface GalleryImage {
  id: string
  url: string
  alt: string
}

/**
 * Product gallery.
 *
 * The main image is the product's own `image_url` followed by its gallery, which
 * is the order the backend already sorts them in. Selected index is clamped so a
 * shrinking list can never leave a blank frame.
 */
export function ProductGallery({
  productName,
  primaryUrl,
  images,
  className,
}: {
  productName: string
  primaryUrl: string | null
  images: ProductImageModel[]
  className?: string
}) {
  const gallery: GalleryImage[] = useMemo(() => {
    const list: GalleryImage[] = []
    if (primaryUrl) {
      list.push({ id: 'primary', url: primaryUrl, alt: productName })
    }
    for (const image of images) {
      if (image.image_url === primaryUrl) continue
      list.push({
        id: image.id,
        url: image.image_url,
        alt: image.alt_text || `${productName} — view ${list.length + 1}`,
      })
    }
    return list
  }, [images, primaryUrl, productName])

  const [selected, setSelected] = useState(0)
  const activeIndex = Math.min(selected, Math.max(gallery.length - 1, 0))
  const active = gallery[activeIndex]

  if (!gallery.length) {
    return (
      <div className={cn('rounded-2xl bg-surface', className)}>
        <ProductImage src={null} alt={productName} ratio="aspect-square" className="w-full" />
      </div>
    )
  }

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      <div className="relative overflow-hidden rounded-2xl border border-zinc-200 bg-white">
        <ProductImage
          key={active?.id}
          src={active?.url}
          alt={active?.alt ?? productName}
          ratio="aspect-square"
          sizes="(max-width: 1024px) 100vw, 50vw"
          className="w-full animate-fade-in"
        />
      </div>

      {gallery.length > 1 && (
        <div className="grid grid-cols-5 gap-3" role="tablist" aria-label="Product images">
          {gallery.map((image, index) => (
            <button
              key={image.id}
              type="button"
              role="tab"
              aria-selected={index === activeIndex}
              aria-label={`Show image ${index + 1}`}
              onClick={() => setSelected(index)}
              className={cn(
                'overflow-hidden rounded-xl border-2 transition-all duration-150',
                index === activeIndex
                  ? 'border-brand-600 ring-1 ring-brand-600'
                  : 'border-zinc-200 opacity-70 hover:opacity-100',
              )}
            >
              <ProductImage src={image.url} alt={image.alt} ratio="aspect-square" className="w-full" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

/** Small helper so other components can reuse the same image resolution. */
export { primaryImageOf }

/** Used by the product page when a customer picks a quantity above the cap. */
export function MaxQuantityNotice({ stock }: { stock: number }) {
  if (stock <= 0) return null
  return (
    <Button variant="ghost" size="sm" className="px-0 text-brand-700 hover:bg-transparent">
      Only {stock} available
    </Button>
  )
}
