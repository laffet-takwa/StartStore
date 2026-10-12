import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY as string

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
  },
})

// Helper to get current user ID
export async function getCurrentUserId(): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser()
  return user?.id ?? null
}

// Helper to get current employee from employees table
export async function getCurrentEmployee() {
  const userId = await getCurrentUserId()
  if (!userId) return null
  const { data, error } = await supabase
    .from('employees')
    .select('*')
    .eq('id', userId)
    .single()
  if (error) throw error
  return data
}

// Helper for paginated response
export interface SupabasePaginated<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

// Helper to convert Supabase response to paginated format
export function toPaginated<T>(data: T[], count: number, page: number, limit: number): SupabasePaginated<T> {
  const totalPages = Math.ceil(count / limit)
  return {
    count,
    next: page < totalPages ? `?page=${page + 1}&limit=${limit}` : null,
    previous: page > 1 ? `?page=${page - 1}&limit=${limit}` : null,
    results: data,
  }
}

// Helper to handle Supabase errors
export function handleSupabaseError(error: unknown): never {
  if (error && typeof error === 'object' && 'message' in error) {
    const err = error as { message: string; details?: string; hint?: string }
    throw new Error(err.message || 'An error occurred')
  }
  throw error
}
