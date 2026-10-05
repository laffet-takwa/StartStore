import { createPortal } from 'react-dom'
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react'

import { useUiStore } from '@/store/uiStore'
import type { Toast as ToastModel, ToastVariant } from '@/store/uiStore'
import { cn } from '@/lib/cn'

const VARIANT_STYLES: Record<ToastVariant, { wrap: string; icon: typeof Info }> = {
  success: { wrap: 'border-emerald-200 bg-white', icon: CheckCircle2 },
  error: { wrap: 'border-rose-200 bg-white', icon: AlertCircle },
  info: { wrap: 'border-zinc-200 bg-white', icon: Info },
}

const ICON_COLOURS: Record<ToastVariant, string> = {
  success: 'text-emerald-600',
  error: 'text-rose-600',
  info: 'text-brand-600',
}

function Toast({ toast }: { toast: ToastModel }) {
  const dismiss = useUiStore((state) => state.dismissToast)
  const { wrap, icon: Icon } = VARIANT_STYLES[toast.variant]

  return (
    <div
      role="status"
      aria-live={toast.variant === 'error' ? 'assertive' : 'polite'}
      className={cn(
        'pointer-events-auto flex w-full animate-slide-up items-start gap-3 rounded-2xl border p-4 shadow-float',
        wrap,
      )}
    >
      <Icon className={cn('mt-0.5 h-5 w-5 shrink-0', ICON_COLOURS[toast.variant])} aria-hidden />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-ink">{toast.title}</p>
        {toast.description && (
          <p className="mt-0.5 text-sm leading-relaxed text-ink-muted">{toast.description}</p>
        )}
        {toast.action && (
          <a
            href={toast.action.href}
            className="mt-2 inline-block text-sm font-semibold text-brand-700 underline-offset-4 hover:underline"
          >
            {toast.action.label}
          </a>
        )}
      </div>
      <button
        type="button"
        onClick={() => dismiss(toast.id)}
        aria-label="Dismiss notification"
        className="-mr-1 -mt-1 rounded-lg p-1.5 text-ink-faint transition-colors hover:bg-zinc-100 hover:text-ink"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}

/** Mounted once, near the root, so any service can raise a notification. */
export function Toaster() {
  const toasts = useUiStore((state) => state.toasts)
  if (typeof document === 'undefined') return null

  return createPortal(
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[60] flex flex-col items-center gap-3 p-4 sm:inset-x-auto sm:right-0 sm:top-0 sm:items-end sm:p-6">
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} />
      ))}
    </div>,
    document.body,
  )
}
