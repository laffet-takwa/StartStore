import { supabase } from '@/lib/supabase'
import type { Employee, LoginResponse } from '@/types'

export const authApi = {
  login: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error

    const { data: employee, error: empError } = await supabase
      .from('employees')
      .select('*')
      .eq('id', data.user.id)
      .single()
    if (empError) throw empError

    return {
      access: data.session?.access_token || '',
      refresh: data.session?.refresh_token || '',
      user: employee as Employee,
    } as LoginResponse
  },

  signup: async (data: {
    email: string
    password: string
    first_name: string
    last_name: string
    phone?: string
    role?: string
  }) => {
    const { data: authData, error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          first_name: data.first_name,
          last_name: data.last_name,
          phone: data.phone,
          role: data.role || 'sales',
        },
      },
    })
    if (error) throw error

    if (authData.user) {
      const { error: empError } = await supabase
        .from('employees')
        .insert({
          id: authData.user.id,
          email: data.email,
          first_name: data.first_name,
          last_name: data.last_name,
          phone: data.phone || '',
          role: data.role || 'sales',
          is_active: true,
          is_staff: true,
        })
      if (empError) throw empError

      const { data: employee, error: fetchError } = await supabase
        .from('employees')
        .select('*')
        .eq('id', authData.user.id)
        .single()
      if (fetchError) throw fetchError

      return {
        access: '',
        refresh: '',
        user: employee as Employee,
      } as LoginResponse
    }

    throw new Error('Signup failed')
  },

  logout: async () => {
    await supabase.auth.signOut()
    return { success: true }
  },

  me: async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { data: employee, error } = await supabase
      .from('employees')
      .select('*')
      .eq('id', user.id)
      .single()
    if (error) throw error
    return employee as Employee
  },

  updateProfile: async (data: Partial<Employee>) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { data: result, error } = await supabase
      .from('employees')
      .update(data)
      .eq('id', user.id)
      .select()
      .single()
    if (error) throw error
    return result as Employee
  },

  changePassword: async (_oldPassword: string, newPassword: string) => {
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) throw error
    return { success: true }
  },
}
