import { useCallback, useEffect } from 'react'
import type { ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'

import { cn } from '@/lib/cn'
import { Button, IconButton } from './Button'

/* -------------------------------------------------------------------------- */
/* Modal                                                                        */
/* -------------------------------------------------------------------------- */

/** Close on Escape and lock body scroll while open. */
function useOverlayBehaviour(open: boolean, onClose: () => void) {
  useEffect(() => {
    if (!open) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = previousOverflow
    }
  }, [open, onClose])
}

export interface ModalProps {
  open: boolean
  onClose: () => void
  title?: string
  description?: string
  children?: ReactNode
  footer?: ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

const MODAL_SIZES = {
  sm: 'max-w-sm',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
} as const

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
  className,
}: ModalProps) {
  useOverlayBehaviour(open, onClose)
  if (!open) return null

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-6">
      <div
        className="absolute inset-0 animate-fade-in bg-ink/40 backdrop-blur-[2px]"
        onClick={onClose}
        aria-hidden
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          'relative z-10 flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-3xl bg-white shadow-float',
          'animate-slide-up sm:rounded-2xl',
          MODAL_SIZES[size],
          className,
        )}
      >
        {(title || description) && (
          <div className="flex items-start justify-between gap-4 border-b border-zinc-100 px-6 py-5">
            <div className="min-w-0">
              {title && <h2 className="text-lg font-semibold tracking-tight text-ink">{title}</h2>}
              {description && (
                <p className="mt-1 text-sm leading-relaxed text-ink-muted">{description}</p>
              )}
            </div>
            <IconButton label="Close" onClick={onClose} className="-mr-2 -mt-1 shrink-0">
              <X className="h-4 w-4" />
            </IconButton>
          </div>
        )}
        {children && <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">{children}</div>}
        {footer && (
          <div className="border-t border-zinc-100 bg-surface px-6 py-4">{footer}</div>
        )}
      </div>
    </div>,
    document.body,
  )
}

/* -------------------------------------------------------------------------- */
/* Drawer                                                                       */
/* -------------------------------------------------------------------------- */

export interface DrawerProps {
  open: boolean
  onClose: () => void
  title?: ReactNode
  children: ReactNode
  footer?: ReactNode
  side?: 'right' | 'left'
  className?: string
  /** Called when the backdrop is clicked; omit to make the drawer non-dismissible. */
  width?: string
}

export function Drawer({
  open,
  onClose,
  title,
  children,
  footer,
  side = 'right',
  className,
  width = 'max-w-md',
}: DrawerProps) {
  useOverlayBehaviour(open, onClose)
  if (!open) return null

  return createPortal(
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 animate-fade-in bg-ink/40 backdrop-blur-[2px]" onClick={onClose} aria-hidden />
      <aside
        role="dialog"
        aria-modal="true"
        className={cn(
          'absolute inset-y-0 flex w-full flex-col bg-white shadow-float',
          'animate-slide-in-right',
          side === 'right' ? 'right-0' : 'left-0',
          width,
          className,
        )}
        style={side === 'left' ? { animationName: 'slide-in-right' } : undefined}
      >
        {title && (
          <div className="flex items-center justify-between gap-4 border-b border-zinc-100 px-5 py-4">
            <div className="min-w-0 flex-1">{title}</div>
            <IconButton label="Close panel" onClick={onClose} className="-mr-2 shrink-0">
              <X className="h-4 w-4" />
            </IconButton>
          </div>
        )}
        <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
        {footer && <div className="border-t border-zinc-100 bg-surface px-5 py-4">{footer}</div>}
      </aside>
    </div>,
    document.body,
  )
}

/* -------------------------------------------------------------------------- */
/* Confirm dialog                                                               */
/* -------------------------------------------------------------------------- */

export interface ConfirmDialogProps {
  open: boolean
  title: string
  description?: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'primary' | 'danger'
  isLoading?: boolean
  onConfirm: () => void
  onCancel: () => void
}

/** Destructive actions always route through here so the copy can set the tone. */
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'primary',
  isLoading,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const handleCancel = useCallback(onCancel, [onCancel])

  return (
    <Modal
      open={open}
      onClose={handleCancel}
      size="sm"
      title={title}
      description={description}
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={handleCancel} disabled={isLoading}>
            {cancelLabel}
          </Button>
          <Button variant={variant === 'danger' ? 'danger' : 'primary'} onClick={onConfirm} isLoading={isLoading}>
            {confirmLabel}
          </Button>
        </div>
      }
    />
  )
}

export { useOverlayBehaviour }
export { Toaster } from './Toaster'
