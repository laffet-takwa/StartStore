import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { notificationsApi } from '@/api'
import { Search, Bell } from 'lucide-react'
import { toast } from 'sonner'

export default function NotificationsPage() {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationsApi.list({ page_size: 50 }),
  })

  const markReadMutation = useMutation({
    mutationFn: (id: string) => notificationsApi.markRead(id),
    onSuccess: () => {
      refetch()
      toast.success('Notification marked as read')
    },
  })

  const markAllReadMutation = useMutation({
    mutationFn: () => notificationsApi.markAllRead(),
    onSuccess: () => {
      refetch()
      toast.success('All notifications marked as read')
    },
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Notifications</h1>
          <p className="text-sm text-muted">Your notifications</p>
        </div>
        <button onClick={() => markAllReadMutation.mutate()} className="inline-flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-primary/90">
          <Bell className="h-4 w-4" /> Mark All Read
        </button>
      </div>

      <div className="bg-surface rounded-lg border border-slate-200">
        <div className="p-4 border-b border-slate-200">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted" />
            <input
              type="text"
              placeholder="Search notifications..."
              className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="p-8 flex justify-center">
            <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {data?.results?.length === 0 ? (
              <p className="px-4 py-8 text-center text-muted">No notifications.</p>
            ) : (
              data?.results?.map((notif: any) => (
                <div key={notif.id} className={`p-4 flex items-start justify-between ${notif.is_read ? 'opacity-60' : 'bg-primary/5'}`}>
                  <div>
                    <p className="text-sm font-medium text-slate-900">{notif.title}</p>
                    <p className="text-sm text-slate-600">{notif.message}</p>
                    <p className="text-xs text-muted mt-1">{new Date(notif.created_at).toLocaleString()}</p>
                  </div>
                  {!notif.is_read && (
                    <button onClick={() => markReadMutation.mutate(notif.id)} className="text-xs text-primary hover:underline">Mark read</button>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  )
}
