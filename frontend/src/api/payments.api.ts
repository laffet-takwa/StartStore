import api from '@/api/axios'
import type { Payment, PaginatedResponse } from '@/types'

export const paymentsApi = {
  list: (params?: Record<string, unknown>) =>
    api.get<PaginatedResponse<Payment>>('/payments/', { params }).then((r) => r.data),

  get: (id: string) => api.get<Payment>(`/payments/${id}/`).then((r) => r.data),

  create: (data: Partial<Payment>) => api.post<Payment>('/payments/', data).then((r) => r.data),
}