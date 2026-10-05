import api from '@/api/axios'
import type { Customer, PaginatedResponse } from '@/types'

export const customersApi = {
  list: (params?: Record<string, unknown>) =>
    api.get<PaginatedResponse<Customer>>('/customers/', { params }).then((r) => r.data),

  get: (id: string) => api.get<Customer>(`/customers/${id}/`).then((r) => r.data),

  create: (data: Partial<Customer>) => api.post<Customer>('/customers/', data).then((r) => r.data),

  update: (id: string, data: Partial<Customer>) =>
    api.patch<Customer>(`/customers/${id}/`, data).then((r) => r.data),

  delete: (id: string) => api.delete(`/customers/${id}/`).then((r) => r.data),

  devices: (id: string) => api.get(`/customers/${id}/devices/`).then((r) => r.data),

  repairs: (id: string) => api.get(`/customers/${id}/repairs/`).then((r) => r.data),

  sales: (id: string) => api.get(`/customers/${id}/sales/`).then((r) => r.data),

  payments: (id: string) => api.get(`/customers/${id}/payments/`).then((r) => r.data),

  summary: (id: string) => api.get(`/customers/${id}/summary/`).then((r) => r.data),
}