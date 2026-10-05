import api from '@/api/axios'
import type { Notification, PaginatedResponse, DashboardOverview } from '@/types'

export const notificationsApi = {
  list: (params?: Record<string, unknown>) =>
    api.get<PaginatedResponse<Notification>>('/notifications/', { params }).then((r) => r.data),

  markRead: (id: string) => api.post(`/notifications/${id}/mark_read/`).then((r) => r.data),

  markAllRead: () => api.post('/notifications/mark_all_read/').then((r) => r.data),

  unreadCount: () => api.get<{ unread_count: number }>('/notifications/unread_count/').then((r) => r.data),
}

export const dashboardApi = {
  overview: () => api.get<DashboardOverview>('/dashboard/').then((r) => r.data),
}

export const reportsApi = {
  sales: (params?: Record<string, unknown>) => api.get('/reports/sales/', { params }).then((r) => r.data),

  repairs: (params?: Record<string, unknown>) => api.get('/reports/repairs/', { params }).then((r) => r.data),

  inventory: (params?: Record<string, unknown>) =>
    api.get('/reports/inventory/', { params }).then((r) => r.data),

  customers: (params?: Record<string, unknown>) =>
    api.get('/reports/customers/', { params }).then((r) => r.data),
}

export const auditApi = {
  list: (params?: Record<string, unknown>) =>
    api.get('/audit/', { params }).then((r) => r.data),

  entityHistory: (params: { entity_type: string; entity_id: string }) =>
    api.get('/audit/entity_history/', { params }).then((r) => r.data),
}