import api from '@/api/axios'
import type { Employee, PaginatedResponse } from '@/types'

export const employeesApi = {
  list: (params?: Record<string, unknown>) =>
    api.get<PaginatedResponse<Employee>>('/employees/', { params }).then((r) => r.data),

  get: (id: string) => api.get<Employee>(`/employees/${id}/`).then((r) => r.data),

  update: (id: string, data: Partial<Employee>) =>
    api.patch<Employee>(`/employees/${id}/`, data).then((r) => r.data),

  delete: (id: string) => api.delete(`/employees/${id}/`).then((r) => r.data),
}
