import { useQuery } from '@tanstack/react-query'
import { roboticsApi } from '@/api'
import { Card, CardBody, Badge, EmptyState } from '@/components/ui'
import type { RoboticsProject } from '@/types'

export default function RoboticsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['robotics'],
    queryFn: () => roboticsApi.list({ page_size: 20 }),
  })

  const projects = (data?.results as RoboticsProject[]) || []

  return (
    <div className="space-y-4 page-enter">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Robotics</h1>
        <p className="text-sm text-muted">Robotics projects and experiments</p>
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
      ) : projects.length === 0 ? (
        <Card>
          <CardBody>
            <EmptyState title="No projects yet" description="Robotics projects will appear here." />
          </CardBody>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project) => (
            <Card key={project.id} hover className="animate-slide-up">
              <CardBody>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900 truncate">{project.title}</p>
                    <p className="text-xs text-muted mt-0.5">{project.technology || ''}</p>
                  </div>
                  <Badge variant={
                    project.status === 'completed' ? 'success' :
                    project.status === 'in_progress' ? 'info' :
                    project.status === 'planning' ? 'warning' : 'default'
                  }>
                    {project.status_label || project.status}
                  </Badge>
                </div>
                <p className="mt-2 text-xs text-slate-600 line-clamp-2">{project.description || ''}</p>
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
