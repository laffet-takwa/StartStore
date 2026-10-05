import api from '@/api/axios'
import type { Invoice, PaginatedResponse } from '@/types'

export const invoicesApi = {
  list: (params?: Record<string, unknown>) =>
    api.get<PaginatedResponse<Invoice>>('/invoices/', { params }).then((r) => r.data),

  get: (id: string) => api.get<Invoice>(`/invoices/${id}/`).then((r) => r.data),

  create: (data: { sale_id?: string; repair_id?: string; notes?: string }) =>
    api.post<Invoice>('/invoices/', data).then((r) => r.data),

  downloadPdf: (id: string) =>
    api.get(`/invoices/${id}/pdf/`, { responseType: 'blob' }).then((r) => r.data),
}