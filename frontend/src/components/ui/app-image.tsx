import { useState } from 'react'
import { cn } from '@/utils/cn'
import { Skeleton } from '@/components/ui'
import { Package } from 'lucide-react'

type AppImageProps = {
  src?: string | null
  alt: string
  className?: string
  aspectRatio?: string
  objectFit?: 'cover' | 'contain'
  loading?: 'lazy' | 'eager'
  priority?: boolean
  fallbackClassName?: string
  containerClassName?: string
}

export function AppImage({
  src,
  alt,
  className,
  aspectRatio = '1 / 1',
  objectFit = 'cover',
  loading = 'lazy',
  priority = false,
  fallbackClassName,
  containerClassName,
}: AppImageProps) {
  const [isLoaded, setIsLoaded] = useState(false)
  const [hasError, setHasError] = useState(false)
  const showSkeleton = !isLoaded && !hasError
  const showFallback = hasError || !src

  return (
    <div
      className={cn('relative overflow-hidden bg-slate-100 dark:bg-dark-surface-secondary', containerClassName)}
      style={{ aspectRatio }}
    >
      {showSkeleton && (
        <div className="absolute inset-0">
          <Skeleton className="h-full w-full" />
        </div>
      )}

      {!showFallback && (
        <img
          src={src!}
          alt={alt}
          loading={priority ? 'eager' : loading}
          decoding="async"
          onLoad={() => setIsLoaded(true)}
          onError={() => setHasError(true)}
          className={cn(
            'h-full w-full transition-opacity duration-300',
            isLoaded ? 'opacity-100' : 'opacity-0',
            objectFit === 'contain' ? 'object-contain p-4' : 'object-cover',
            className
          )}
        />
      )}

      {showFallback && (
        <div className={cn('absolute inset-0 flex flex-col items-center justify-center gap-2 text-slate-400 dark:text-slate-600', fallbackClassName)}>
          <Package className="h-10 w-10" />
          <span className="text-[11px] text-slate-400 dark:text-slate-500">Image unavailable</span>
        </div>
      )}
    </div>
  )
}
