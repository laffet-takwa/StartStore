import { supabase, toPaginated } from '@/lib/supabase'
import type { Customer, PaginatedResponse, Device, RepairTicket, Sale, Payment } from '@/types'

// Helper to map customer with computed fields
function mapCustomer(c: Record<string, unknown>): Customer {
  return {
    ...c,
    full_name: `${c.first_name || ''} ${c.last_name || ''}`.trim(),
    device_count: Array.isArray(c.devices) ? c.devices.length : 0,
    repair_count: Array.isArray(c.repairs) ? c.repairs.length : 0,
    total_spent: Array.isArray(c.sales)
      ? c.sales.reduce((sum: number, s: Record<string, unknown>) =>
          s.status === 'confirmed' ? sum + Number(s.total || 0) : sum, 0)
      : 0,
  } as Customer
}

export const customersApi = {
  list: async (params?: Record<string, unknown>) => {
    let query = supabase
      .from('customers')
      .select(`
        *,
        devices:devices(count),
        repairs:repair_tickets(count),
        sales:sales(count)
      `, { count: 'exact' })

    if (params?.search) {
      query = query.or(`first_name.ilike.%${params.search}%,last_name.ilike.%${params.search}%,phone.ilike.%${params.search}%,email.ilike.%${params.search}%`)
    }
    if (params?.is_active !== undefined) {
      query = query.eq('is_active', params.is_active)
    }
    if (params?.governorate) {
      query = query.eq('governorate', params.governorate)
    }

    const page = Number(params?.page) || 1
    const limit = Number(params?.limit) || 20
    const from = (page - 1) * limit
    const to = from + limit - 1

    query = query.range(from, to).order('created_at', { ascending: false })

    const { data, error, count } = await query
    if (error) throw error

    const customers = (data || []).map(mapCustomer)
    return toPaginated(customers, count || 0, page, limit) as unknown as PaginatedResponse<Customer>
  },

  get: async (id: string) => {
    const { data, error } = await supabase
      .from('customers')
      .select(`
        *,
        devices:devices(*),
        repairs:repair_tickets(*),
        sales:sales(*)
      `)
      .eq('id', id)
      .single()
    if (error) throw error
    return mapCustomer(data as Record<string, unknown>)
  },

  create: async (data: Partial<Customer>) => {
    const { data: result, error } = await supabase
      .from('customers')
      .insert(data)
      .select()
      .single()
    if (error) throw error
    return mapCustomer(result as Record<string, unknown>)
  },

  update: async (id: string, data: Partial<Customer>) => {
    const { data: result, error } = await supabase
      .from('customers')
      .update(data)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return mapCustomer(result as Record<string, unknown>)
  },

  delete: async (id: string) => {
    const { error } = await supabase
      .from('customers')
      .delete()
      .eq('id', id)
    if (error) throw error
    return { success: true }
  },

  devices: async (id: string) => {
    const { data, error } = await supabase
      .from('devices')
      .select('*')
      .eq('customer', id)
      .order('created_at', { ascending: false })
    if (error) throw error
    return data as Device[]
  },

  repairs: async (id: string) => {
    const { data, error } = await supabase
      .from('repair_tickets')
      .select('*')
      .eq('customer', id)
      .order('created_at', { ascending: false })
    if (error) throw error
    return data as RepairTicket[]
  },

  sales: async (id: string) => {
    const { data, error } = await supabase
      .from('sales')
      .select('*')
      .eq('customer', id)
      .order('created_at', { ascending: false })
    if (error) throw error
    return data as Sale[]
  },

  payments: async (id: string) => {
    const { data, error } = await supabase
      .from('payments')
      .select(`
        *,
        sale:sales(customer)
      `)
      .eq('sale.customer', id)
      .order('paid_at', { ascending: false })
    if (error) throw error
    return data as Payment[]
  },

  summary: async (id: string) => {
    const { data: customer, error: custError } = await supabase
      .from('customers')
      .select('*')
      .eq('id', id)
      .single()
    if (custError) throw custError

    const { data: devices } = await supabase
      .from('devices')
      .select('id', { count: 'exact' })
      .eq('customer', id)

    const { data: repairs } = await supabase
      .from('repair_tickets')
      .select('id, status', { count: 'exact' })
      .eq('customer', id)

    const { data: sales } = await supabase
      .from('sales')
      .select('total, status', { count: 'exact' })
      .eq('customer', id)

    const totalSpent = (sales || [])
      .filter((s: Record<string, unknown>) => s.status === 'confirmed')
      .reduce((sum: number, s: Record<string, unknown>) => sum + Number(s.total || 0), 0)

    return {
      ...customer,
      device_count: devices?.length || 0,
      repair_count: repairs?.length || 0,
      total_spent: totalSpent,
      active_repairs: (repairs || []).filter((r: Record<string, unknown>) =>
        !['delivered', 'cancelled'].includes(r.status as string)).length,
    }
  },
}
