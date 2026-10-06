import api from '@/api/axios'
import type { Content } from '@/types'

export const contentApi = {
  list: (params?: Record<string, unknown>) =>
    api.get<{ results: Content[] }>('/content/', { params }).then((r) => r.data),
}
