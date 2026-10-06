import { useQuery } from '@tanstack/react-query'
import { contentApi } from '@/api'
import { Card, CardBody, Badge, EmptyState } from '@/components/ui'
import type { Content } from '@/types'

export default function ContentPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['content'],
    queryFn: () => contentApi.list({ page_size: 20 }),
  })

  const items = (data?.results as Content[]) || []

  return (
    <div className="space-y-4 page-enter">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Educational Content</h1>
        <p className="text-sm text-muted">Articles, tutorials, and courses</p>
      </div>

      {isLoading ? (
        <Card>
          <CardBody>
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-16 rounded-md bg-slate-100 animate-pulse" />
              ))}
            </div>
          </CardBody>
        </Card>
      ) : items.length === 0 ? (
        <Card>
          <CardBody>
            <EmptyState title="No content yet" description="Educational content will appear here." />
          </CardBody>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item) => (
            <Card key={item.id} hover className="animate-slide-up">
              <CardBody>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900 truncate">{item.title}</p>
                    <p className="text-xs text-muted mt-0.5">{item.category_name || 'General'}</p>
                  </div>
                  <Badge variant={item.is_published ? 'success' : 'warning'}>
                    {item.is_published ? 'Published' : 'Draft'}
                  </Badge>
                </div>
                <p className="mt-2 text-xs text-slate-600 line-clamp-2">{item.description || ''}</p>
                <div className="mt-3 flex items-center justify-between text-xs text-muted">
                  <span>{item.content_type}</span>
                  <span>{new Date(item.created_at).toLocaleDateString()}</span>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
