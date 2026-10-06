import api from '@/api/axios'
import type { RoboticsProject } from '@/types'

export const roboticsApi = {
  list: (params?: Record<string, unknown>) =>
    api.get<{ results: RoboticsProject[] }>('/robotics/', { params }).then((r) => r.data),
}
