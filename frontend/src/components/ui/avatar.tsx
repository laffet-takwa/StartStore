import { type ReactNode } from 'react'
import { cn } from '@/utils/cn'

export type AvatarProps = {
  src?: string
  alt?: string
  fallback?: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  children?: ReactNode
}

const sizeClasses = {
  xs: 'h-6 w-6 text-xs',
  sm: 'h-8 w-8 text-sm',
  md: 'h-10 w-10 text-sm',
  lg: 'h-12 w-12 text-base',
  xl: 'h-16 w-16 text-lg',
}

export function Avatar({ src, alt, fallback, size = 'md', className = '', children }: AvatarProps) {
  const initials = fallback
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <div
      className={cn(
        'relative inline-flex items-center justify-center rounded-full font-medium overflow-hidden flex-shrink-0',
        'bg-primary text-white',
        sizeClasses[size],
        className
      )}
    >
      {src ? (
        <img src={src} alt={alt || fallback || 'Avatar'} className="h-full w-full object-cover" />
      ) : (
        <span className="select-none">{children || initials || '?'}</span>
      )}
    </div>
  )
}
