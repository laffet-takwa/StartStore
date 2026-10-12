import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { supabase } from '@/lib/supabase'
import type { Employee } from '@/types'

interface AuthContextType {
  user: Employee | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  signup: (data: {
    email: string
    password: string
    first_name: string
    last_name: string
    phone?: string
    role?: string
  }) => Promise<void>
  logout: () => Promise<void>
  updateProfile: (data: Partial<Employee>) => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Employee | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user && mounted) {
          const { data: employee, error } = await supabase
            .from('employees')
            .select('*')
            .eq('id', session.user.id)
            .single()
          if (!error && employee && mounted) {
            setUser(employee as Employee)
          }
        }
      } catch {
        // ignore
      } finally {
        if (mounted) setLoading(false)
      }
    }

    initAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        const { data: employee, error } = await supabase
          .from('employees')
          .select('*')
          .eq('id', session.user.id)
          .single()
        if (!error && employee) {
          setUser(employee as Employee)
        } else {
          setUser(null)
        }
      } else {
        setUser(null)
      }
      setLoading(false)
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  const login = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error

    const { data: employee, error: empError } = await supabase
      .from('employees')
      .select('*')
      .eq('id', data.user.id)
      .single()
    if (empError) throw empError
    setUser(employee as Employee)
  }

  const signup = async (data: {
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
      setUser(employee as Employee)
    }
  }

  const logout = async () => {
    await supabase.auth.signOut()
    setUser(null)
  }

  const updateProfile = async (data: Partial<Employee>) => {
    if (!user) return
    const { error } = await supabase
      .from('employees')
      .update(data)
      .eq('id', user.id)
    if (error) throw error
    setUser({ ...user, ...data })
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
