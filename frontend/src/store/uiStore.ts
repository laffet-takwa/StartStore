/** Ephemeral UI state: toasts, mobile navigation, admin sidebar. */

import { create } from 'zustand'

export type ToastVariant = 'success' | 'error' | 'info'

export interface Toast {
  id: string
  title: string
  description?: string
  variant: ToastVariant
  /** Optional action, e.g. "View cart". */
  action?: { label: string; href: string }
}

interface UiState {
  toasts: Toast[]
  isMobileNavOpen: boolean
  isAdminSidebarOpen: boolean
  pushToast: (toast: Omit<Toast, 'id'>) => string
  dismissToast: (id: string) => void
  setMobileNavOpen: (open: boolean) => void
  setAdminSidebarOpen: (open: boolean) => void
}

let counter = 0

export const useUiStore = create<UiState>((set) => ({
  toasts: [],
  isMobileNavOpen: false,
  isAdminSidebarOpen: false,

  pushToast: (toast) => {
    counter += 1
    const id = `toast-${counter}`
    set((state) => ({ toasts: [...state.toasts, { ...toast, id }] }))
    // Errors linger; confirmations get out of the way.
    const ttl = toast.variant === 'error' ? 7000 : 4000
    window.setTimeout(() => {
      set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }))
    }, ttl)
    return id
  },

  dismissToast: (id) => set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
  setMobileNavOpen: (open) => set({ isMobileNavOpen: open }),
  setAdminSidebarOpen: (open) => set({ isAdminSidebarOpen: open }),
}))

/** Convenience helpers so call sites read as `toast.success('Saved')`. */
export const toast = {
  success: (title: string, description?: string, action?: Toast['action']) =>
    useUiStore.getState().pushToast({ title, description, variant: 'success', action }),
  error: (title: string, description?: string) =>
    useUiStore.getState().pushToast({ title, description, variant: 'error' }),
  info: (title: string, description?: string, action?: Toast['action']) =>
    useUiStore.getState().pushToast({ title, description, variant: 'info', action }),
}
