import { get, patch, post } from './api'
import type {
  AdminProfile,
  DashboardResponse,
  Paginated,
  Profile,
  UserRole,
} from '@/types'

export const userService = {
  /** The authenticated profile. */
  me: () => get<Profile>('/auth/me/'),

  updateProfile: (payload: Partial<Pick<Profile, 'full_name' | 'phone' | 'avatar_url'>>) =>
    patch<Profile>('/auth/me/', payload),
}

export const adminUserService = {
  list: (params?: {
    role?: UserRole
    search?: string
    joined_after?: string
    joined_before?: string
    page?: number
    page_size?: number
  }) => get<Paginated<AdminProfile>>('/admin/users/', params),

  get: (id: string) => get<AdminProfile>(`/admin/users/${id}/`),

  update: (id: string, payload: Partial<Pick<AdminProfile, 'full_name' | 'phone' | 'role'>>) =>
    patch<AdminProfile>(`/admin/users/${id}/`, payload),

  /** Shorthand for setting the role. */
  setRole: (id: string, role: UserRole) => post<AdminProfile>(`/admin/users/${id}/role/`, { role }),
}

export const adminDashboardService = {
  get: () => get<DashboardResponse>('/admin/dashboard/'),
}

export type UserService = typeof userService
export type AdminUserService = typeof adminUserService
