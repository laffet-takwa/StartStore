import { useEffect, useRef } from 'react'

export function Drawer({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
}) {
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div
        ref={panelRef}
        className="absolute right-0 top-0 bottom-0 w-full max-w-sm bg-surface shadow-xl border-l border-slate-200 animate-slide-in-right"
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-4 h-14">
          <p className="text-sm font-semibold text-slate-900">{title}</p>
          <button onClick={onClose} className="text-sm text-muted hover:text-slate-900">
            Close
          </button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  )
}
