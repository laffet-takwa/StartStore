import api from '@/api/axios'
import type {
  RepairTicket,
  RepairPart,
  RepairImage,
  RepairStatusHistory,
  PaginatedResponse,
  PublicRepairTracking,
} from '@/types'

export const repairsApi = {
  list: (params?: Record<string, unknown>) =>
    api.get<PaginatedResponse<RepairTicket>>('/repairs/', { params }).then((r) => r.data),

  get: (id: string) => api.get<RepairTicket>(`/repairs/${id}/`).then((r) => r.data),

  create: (data: Partial<RepairTicket>) =>
    api.post<RepairTicket>('/repairs/', data).then((r) => r.data),

  update: (id: string, data: Partial<RepairTicket>) =>
    api.patch<RepairTicket>(`/repairs/${id}/`, data).then((r) => r.data),

  delete: (id: string) => api.delete(`/repairs/${id}/`).then((r) => r.data),

  updateStatus: (id: string, status: string, note?: string) =>
    api.post(`/repairs/${id}/update_status/`, { status, note }).then((r) => r.data),

  statusHistory: (id: string) =>
    api.get<RepairStatusHistory[]>(`/repairs/${id}/status_history/`).then((r) => r.data),

  addPart: (id: string, data: { product: string; quantity: number; unit_price: number }) =>
    api.post<RepairPart>(`/repairs/${id}/add_part/`, data).then((r) => r.data),

  removePart: (id: string, partId: string) =>
    api.delete(`/repairs/${id}/parts/${partId}/`).then((r) => r.data),

  addImage: (id: string, formData: FormData) =>
    api.post<RepairImage>(`/repairs/${id}/add_image/`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then((r) => r.data),

  removeImage: (id: string, imageId: string) =>
    api.delete(`/repairs/${id}/images/${imageId}/`).then((r) => r.data),

  myRepairs: () => api.get<PaginatedResponse<RepairTicket>>('/repairs/my_repairs/').then((r) => r.data),

  dashboardStats: () => api.get('/repairs/dashboard_stats/').then((r) => r.data),
}

export const publicRepairsApi = {
  track: (matricule: string) =>
    api
      .get<PublicRepairTracking>('/public/repairs/status/', { params: { matricule } })
      .then((r) => r.data),

  history: (matricule: string) =>
    api.get(`/public/repairs/history/${matricule}/`).then((r) => r.data),
}