import api from '@/api/axios'
import type { Employee, LoginResponse } from '@/types'

export const authApi = {
  login: (email: string, password: string) =>
    api.post<LoginResponse>('/auth/login/', { email, password }).then((r) => r.data),

  logout: () => api.post('/auth/logout/').then((r) => r.data),

  me: () => api.get<Employee>('/auth/me/').then((r) => r.data),

  updateProfile: (data: Partial<Employee>) =>
    api.patch<Employee>('/auth/me/update/', data).then((r) => r.data),

  changePassword: (oldPassword: string, newPassword: string) =>
    api.post('/auth/me/password/', { old_password: oldPassword, new_password: newPassword }).then((r) => r.data),
}