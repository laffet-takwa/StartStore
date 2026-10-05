import api from '@/api/axios'
import type { Sale, PaginatedResponse } from '@/types'

export const salesApi = {
  list: (params?: Record<string, unknown>) =>
    api.get<PaginatedResponse<Sale>>('/sales/', { params }).then((r) => r.data),

  get: (id: string) => api.get<Sale>(`/sales/${id}/`).then((r) => r.data),

  create: (data: Partial<Sale>) => api.post<Sale>('/sales/', data).then((r) => r.data),

  update: (id: string, data: Partial<Sale>) =>
    api.patch<Sale>(`/sales/${id}/`, data).then((r) => r.data),

  confirm: (id: string) => api.post(`/sales/${id}/confirm/`).then((r) => r.data),

  cancel: (id: string) => api.post(`/sales/${id}/cancel/`).then((r) => r.data),

  dashboardStats: () => api.get('/sales/dashboard_stats/').then((r) => r.data),
}