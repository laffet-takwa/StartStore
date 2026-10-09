import { useEffect, useCallback, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from 'lucide-react'
import { cn } from '@/utils/cn'

type ImageLightboxProps = {
  images: string[]
  initialIndex?: number
  open: boolean
  onClose: () => void
  altPrefix?: string
}

export function ImageLightbox({
  images,
  initialIndex = 0,
  open,
  onClose,
  altPrefix = 'Image',
}: ImageLightboxProps) {
  const [index, setIndex] = useState(initialIndex)
  const [zoomed, setZoomed] = useState(false)

  const goNext = useCallback(() => {
    setIndex((i) => (i + 1) % images.length)
  }, [images.length])

  const goPrev = useCallback(() => {
    setIndex((i) => (i - 1 + images.length) % images.length)
  }, [images.length])

  useEffect(() => {
    setIndex(initialIndex)
    setZoomed(false)
  }, [initialIndex, open])

  useEffect(() => {
    if (!open) return

    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight') goNext()
      if (e.key === 'ArrowLeft') goPrev()
    }

    document.addEventListener('keydown', handler)
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', handler)
      document.body.style.overflow = ''
    }
  }, [open, onClose, goNext, goPrev])

  if (!open || images.length === 0) return null

  const current = images[index]

  return (
    <AnimatePresence mode="wait">
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[80] flex items-center justify-center"
          role="dialog"
          aria-modal="true"
          aria-label="Image lightbox"
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={onClose}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="relative z-10 flex items-center justify-center w-full h-full p-4 md:p-8"
          >
            {images.length > 1 && (
              <button
                onClick={goPrev}
                className="absolute left-2 md:left-6 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors z-20"
                aria-label="Previous image"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
            )}

            <div className="relative max-w-5xl max-h-[85vh] flex items-center justify-center">
              <motion.img
                key={index}
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={{ duration: 0.2 }}
                src={current}
                alt={`${altPrefix} ${index + 1}`}
                className={cn(
                  'max-w-full max-h-[80vh] object-contain rounded-lg shadow-2xl transition-transform duration-200',
                  zoomed ? 'scale-150 cursor-zoom-out' : 'cursor-zoom-in'
                )}
                onClick={() => setZoomed((z) => !z)}
                draggable={false}
              />
            </div>

            {images.length > 1 && (
              <button
                onClick={goNext}
                className="absolute right-2 md:right-6 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors z-20"
                aria-label="Next image"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            )}

            <div className="absolute top-4 right-4 flex items-center gap-2 z-20">
              <button
                onClick={() => setZoomed((z) => !z)}
                className="h-9 w-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
                aria-label={zoomed ? 'Zoom out' : 'Zoom in'}
              >
                {zoomed ? <ZoomOut className="h-4 w-4" /> : <ZoomIn className="h-4 w-4" />}
              </button>
              <button
                onClick={onClose}
                className="h-9 w-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
                aria-label="Close lightbox"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {images.length > 1 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-20">
                {images.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setIndex(i)}
                    className={cn(
                      'h-1.5 rounded-full transition-all duration-200',
                      i === index ? 'w-6 bg-white' : 'w-1.5 bg-white/40 hover:bg-white/60'
                    )}
                    aria-label={`Go to image ${i + 1}`}
                  />
                ))}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
