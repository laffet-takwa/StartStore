import { supabase, toPaginated } from '@/lib/supabase'
import type { Employee, PaginatedResponse } from '@/types'

function mapEmployee(e: Record<string, unknown>): Employee {
  return {
    ...e,
    full_name: `${e.first_name || ''} ${e.last_name || ''}`.trim(),
    role_display: e.role as string,
  } as Employee
}

export const employeesApi = {
  list: async (params?: Record<string, unknown>) => {
    let query = supabase
      .from('employees')
      .select('*', { count: 'exact' })

    if (params?.search) {
      query = query.or(`first_name.ilike.%${params.search}%,last_name.ilike.%${params.search}%,email.ilike.%${params.search}%`)
    }
    if (params?.role) {
      query = query.eq('role', params.role)
    }
    if (params?.is_active !== undefined) {
      query = query.eq('is_active', params.is_active)
    }

    const page = Number(params?.page) || 1
    const limit = Number(params?.limit) || 20
    const from = (page - 1) * limit
    const to = from + limit - 1

    query = query.range(from, to).order('created_at', { ascending: false })

    const { data, error, count } = await query
    if (error) throw error

    const employees = (data || []).map(mapEmployee)
    return toPaginated(employees, count || 0, page, limit) as unknown as PaginatedResponse<Employee>
  },

  get: async (id: string) => {
    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .eq('id', id)
      .single()
    if (error) throw error
    return mapEmployee(data as Record<string, unknown>)
  },

  update: async (id: string, data: Partial<Employee>) => {
    const { data: result, error } = await supabase
      .from('employees')
      .update(data)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return mapEmployee(result as Record<string, unknown>)
  },

  delete: async (id: string) => {
    const { error } = await supabase
      .from('employees')
      .delete()
      .eq('id', id)
    if (error) throw error
    return { success: true }
  },
}
