import { useQuery, useMutation } from '@tanstack/react-query'
import { notificationsApi } from '@/api'
import { Bell } from 'lucide-react'
import { toast } from 'sonner'
import { Card, CardBody, Button, EmptyState } from '@/components/ui'

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
    <div className="space-y-4 page-enter">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Notifications</h1>
          <p className="text-sm text-muted">Your notifications</p>
        </div>
        <Button variant="outline" icon={<Bell className="h-4 w-4" />} onClick={() => markAllReadMutation.mutate()}>
          Mark All Read
        </Button>
      </div>

      <Card>
        <CardBody className="p-0">
          {isLoading ? (
            <div className="p-4 space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-16 rounded-md bg-slate-100 animate-pulse" />
              ))}
            </div>
          ) : data?.results?.length === 0 ? (
            <EmptyState title="No notifications" description="You're all caught up." />
          ) : (
            <div className="divide-y divide-slate-100">
              {data?.results?.map((notif: any) => (
                <div
                  key={notif.id}
                  className={`p-4 flex items-start justify-between gap-3 ${notif.is_read ? 'opacity-60' : 'bg-primary/5'}`}
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-900">{notif.title}</p>
                    <p className="text-sm text-slate-600">{notif.message}</p>
                    <p className="text-xs text-muted mt-1">{new Date(notif.created_at).toLocaleString()}</p>
                  </div>
                  {!notif.is_read && (
                    <button
                      onClick={() => markReadMutation.mutate(notif.id)}
                      className="text-xs text-primary hover:underline whitespace-nowrap"
                    >
                      Mark read
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  )
}
