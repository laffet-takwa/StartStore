import api from '@/api/axios'
import type { Device, PaginatedResponse } from '@/types'

export const devicesApi = {
  list: (params?: Record<string, unknown>) =>
    api.get<PaginatedResponse<Device>>('/devices/', { params }).then((r) => r.data),

  get: (id: string) => api.get<Device>(`/devices/${id}/`).then((r) => r.data),

  create: (data: Partial<Device>) => api.post<Device>('/devices/', data).then((r) => r.data),

  update: (id: string, data: Partial<Device>) =>
    api.patch<Device>(`/devices/${id}/`, data).then((r) => r.data),

  delete: (id: string) => api.delete(`/devices/${id}/`).then((r) => r.data),

  repairs: (id: string) => api.get(`/devices/${id}/repairs/`).then((r) => r.data),
}