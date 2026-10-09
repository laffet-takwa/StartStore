import { useState, useEffect, useRef } from 'react'
import { Bell, Inbox, Wrench, ShoppingCart, CreditCard, Settings } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/utils/cn'
import { Button } from '@/components/ui'
import type { Notification } from '@/types'
import { notificationsApi } from '@/api/dashboard.api'
import { useNavigate } from 'react-router-dom'

const categoryIcons: Record<string, React.ReactNode> = {
  repair: <Wrench className="h-4 w-4" />,
  order: <ShoppingCart className="h-4 w-4" />,
  payment: <CreditCard className="h-4 w-4" />,
  system: <Settings className="h-4 w-4" />,
}

export function NotificationCenter() {
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const containerRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()

  useEffect(() => {
    let mounted = true
    setLoading(true)
    notificationsApi
      .list({ page_size: 20 })
      .then((res) => {
        if (!mounted) return
        setNotifications(res.results)
        setUnreadCount(res.results.filter((n: Notification) => !n.is_read).length)
      })
      .finally(() => mounted && setLoading(false))
    return () => { mounted = false }
  }, [])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const markAllRead = async () => {
    const unread = notifications.filter((n) => !n.is_read)
    if (unread.length === 0) return
    await Promise.all(unread.map((n) => notificationsApi.markRead(n.id)))
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
    setUnreadCount(0)
  }

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.is_read) {
      await notificationsApi.markRead(notification.id)
      setNotifications((prev) => prev.map((n) => (n.id === notification.id ? { ...n, is_read: true } : n)))
      setUnreadCount((c) => Math.max(0, c - 1))
    }
    setOpen(false)
    if (notification.reference_type && notification.reference_id) {
      const routes: Record<string, string> = {
        repair: `/repairs/${notification.reference_id}`,
        sale: `/sales/${notification.reference_id}`,
        invoice: `/invoices/${notification.reference_id}`,
      }
      const route = routes[notification.reference_type]
      if (route) navigate(route)
    }
  }

  const grouped = notifications.reduce<Record<string, Notification[]>>((acc, n) => {
    const key = n.created_at?.split('T')[0] || 'other'
    acc[key] = acc[key] || []
    acc[key].push(n)
    return acc
  }, {})

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'relative p-2 rounded-lg transition-colors',
          'hover:bg-slate-100 dark:hover:bg-dark-surface-secondary'
        )}
        aria-label="Notifications"
      >
        <Bell className="h-[18px] w-[18px] text-slate-500 dark:text-slate-400" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 h-4.5 w-4.5 rounded-full bg-danger text-white text-[10px] font-bold flex items-center justify-center animate-pulse-soft">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.98 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className={cn(
              'absolute right-0 mt-2 w-[380px] max-h-[480px] overflow-hidden rounded-xl shadow-xl border border-slate-200 dark:border-dark-border dark:bg-dark-surface z-50 flex flex-col'
            )}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-base">
              <h3 className="text-sm font-semibold text-base">Notifications</h3>
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="text-xs text-primary hover:text-primary-hover font-medium transition-colors"
                >
                  Mark all as read
                </button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="py-8 flex flex-col items-center gap-2">
                  <div className="h-5 w-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  <p className="text-xs text-muted">Loading...</p>
                </div>
              ) : notifications.length === 0 ? (
                <div className="py-10 flex flex-col items-center gap-2 text-center px-4">
                  <Inbox className="h-8 w-8 text-slate-300 dark:text-slate-600" />
                  <p className="text-sm text-muted">No notifications yet</p>
                </div>
              ) : (
                <div className="py-1">
                  {Object.entries(grouped).map(([date, items]) => (
                    <div key={date}>
                      <div className="px-4 py-1.5">
                        <p className="text-[11px] font-medium text-muted uppercase tracking-wider">
                          {new Date(date).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                        </p>
                      </div>
                      {items.map((notification) => (
                        <button
                          key={notification.id}
                          onClick={() => handleNotificationClick(notification)}
                          className={cn(
                            'w-full text-left px-4 py-2.5 transition-colors',
                            'hover:bg-slate-50 dark:hover:bg-dark-surface-secondary',
                            !notification.is_read && 'bg-primary-50/60 dark:bg-dark-primary-light/20'
                          )}
                        >
                          <div className="flex gap-3">
                            <div className={cn('h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5', !notification.is_read ? 'bg-primary/10 text-primary dark:bg-dark-primary/25 dark:text-dark-primary' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400')}>
                              {categoryIcons[notification.type] || <Bell className="h-4 w-4" />}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className={cn('text-sm leading-snug', !notification.is_read ? 'text-slate-900 dark:text-slate-100 font-medium' : 'text-slate-600 dark:text-slate-300')}>
                                {notification.title}
                              </p>
                              {notification.message && (
                                <p className="text-xs text-muted mt-0.5 line-clamp-2">{notification.message}</p>
                              )}
                              <p className="text-[11px] text-muted dark:text-slate-500 mt-1">
                                {new Date(notification.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </div>
                            {!notification.is_read && (
                              <div className="h-2 w-2 rounded-full bg-primary flex-shrink-0 mt-1.5" />
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="px-4 py-2.5 border-t border-base">
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-center"
                onClick={() => { navigate('/notifications'); setOpen(false) }}
              >
                View all notifications
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

