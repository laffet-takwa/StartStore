import { supabase, toPaginated } from '@/lib/supabase'
import type { Device, PaginatedResponse, RepairTicket } from '@/types'

function mapDevice(d: Record<string, unknown>): Device {
  return {
    ...d,
    customer_name: (d.customer as Record<string, unknown>)
      ? `${(d.customer as Record<string, unknown>).first_name || ''} ${(d.customer as Record<string, unknown>).last_name || ''}`.trim()
      : '',
    device_type_display: d.device_type as string,
    repair_count: Array.isArray(d.repairs) ? d.repairs.length : 0,
  } as Device
}

export const devicesApi = {
  list: async (params?: Record<string, unknown>) => {
    let query = supabase
      .from('devices')
      .select(`
        *,
        customer:customers(*),
        repairs:repair_tickets(count)
      `, { count: 'exact' })

    if (params?.search) {
      query = query.or(`brand.ilike.%${params.search}%,model.ilike.%${params.search}%,serial_number.ilike.%${params.search}%`)
    }
    if (params?.customer) {
      query = query.eq('customer', params.customer)
    }
    if (params?.device_type) {
      query = query.eq('device_type', params.device_type)
    }

    const page = Number(params?.page) || 1
    const limit = Number(params?.limit) || 20
    const from = (page - 1) * limit
    const to = from + limit - 1

    query = query.range(from, to).order('created_at', { ascending: false })

    const { data, error, count } = await query
    if (error) throw error

    const devices = (data || []).map(mapDevice)
    return toPaginated(devices, count || 0, page, limit) as unknown as PaginatedResponse<Device>
  },

  get: async (id: string) => {
    const { data, error } = await supabase
      .from('devices')
      .select(`
        *,
        customer:customers(*),
        repairs:repair_tickets(*)
      `)
      .eq('id', id)
      .single()
    if (error) throw error
    return mapDevice(data as Record<string, unknown>)
  },

  create: async (data: Partial<Device>) => {
    const { data: result, error } = await supabase
      .from('devices')
      .insert(data)
      .select()
      .single()
    if (error) throw error
    return mapDevice(result as Record<string, unknown>)
  },

  update: async (id: string, data: Partial<Device>) => {
    const { data: result, error } = await supabase
      .from('devices')
      .update(data)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return mapDevice(result as Record<string, unknown>)
  },

  delete: async (id: string) => {
    const { error } = await supabase
      .from('devices')
      .delete()
      .eq('id', id)
    if (error) throw error
    return { success: true }
  },

  repairs: async (id: string) => {
    const { data, error } = await supabase
      .from('repair_tickets')
      .select('*')
      .eq('device', id)
      .order('created_at', { ascending: false })
    if (error) throw error
    return data as RepairTicket[]
  },
}
