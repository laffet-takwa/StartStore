import { supabase, toPaginated } from '@/lib/supabase'
import type {
  RepairTicket,
  RepairPart,
  RepairImage,
  RepairStatusHistory,
  PaginatedResponse,
  PublicRepairTracking,
} from '@/types'

const STATUS_LABELS: Record<string, string> = {
  received: 'Reçu',
  diagnosis: 'Diagnostic',
  waiting_customer: 'En attente du client',
  approved: 'Réparation approuvée',
  repairing: 'En réparation',
  testing: 'Test en cours',
  ready: 'Prêt à récupérer',
  delivered: 'Livré',
  cancelled: 'Annulé',
}

const TRANSITIONS: Record<string, string[]> = {
  received: ['diagnosis', 'cancelled'],
  diagnosis: ['waiting_customer', 'cancelled'],
  waiting_customer: ['approved', 'cancelled'],
  approved: ['repairing', 'cancelled'],
  repairing: ['testing', 'waiting_customer', 'cancelled'],
  testing: ['ready', 'repairing', 'cancelled'],
  ready: ['delivered', 'cancelled'],
  delivered: [],
  cancelled: [],
}

function mapRepair(r: Record<string, unknown>): RepairTicket {
  const status = r.status as string
  return {
    ...r,
    status_label: STATUS_LABELS[status] || status,
    can_transition: TRANSITIONS[status] || [],
    customer: r.customer as RepairTicket['customer'],
    device: r.device as RepairTicket['device'],
    technician: r.technician as RepairTicket['technician'],
    parts: (r.parts as RepairPart[]) || [],
    images: (r.images as RepairImage[]) || [],
    status_history: (r.status_history as RepairStatusHistory[]) || [],
  } as RepairTicket
}

export const repairsApi = {
  list: async (params?: Record<string, unknown>) => {
    let query = supabase
      .from('repair_tickets')
      .select(`
        *,
        customer:customers(*),
        device:devices(*),
        technician:employees(*),
        parts:repair_parts(*),
        images:repair_images(*),
        status_history:repair_status_history(*)
      `, { count: 'exact' })

    if (params?.search) {
      query = query.or(`ticket_number.ilike.%${params.search}%,tracking_matricule.ilike.%${params.search}%`)
    }
    if (params?.status) {
      query = query.eq('status', params.status)
    }
    if (params?.customer) {
      query = query.eq('customer', params.customer)
    }
    if (params?.technician) {
      query = query.eq('technician', params.technician)
    }

    const page = Number(params?.page) || 1
    const limit = Number(params?.limit) || 20
    const from = (page - 1) * limit
    const to = from + limit - 1

    query = query.range(from, to).order('created_at', { ascending: false })

    const { data, error, count } = await query
    if (error) throw error

    const repairs = (data || []).map(mapRepair)
    return toPaginated(repairs, count || 0, page, limit) as unknown as PaginatedResponse<RepairTicket>
  },

  get: async (id: string) => {
    const { data, error } = await supabase
      .from('repair_tickets')
      .select(`
        *,
        customer:customers(*),
        device:devices(*),
        technician:employees(*),
        parts:repair_parts(*),
        images:repair_images(*),
        status_history:repair_status_history(*)
      `)
      .eq('id', id)
      .single()
    if (error) throw error
    return mapRepair(data as Record<string, unknown>)
  },

  create: async (data: Partial<RepairTicket>) => {
    const { data: result, error } = await supabase
      .from('repair_tickets')
      .insert(data)
      .select()
      .single()
    if (error) throw error
    return mapRepair(result as Record<string, unknown>)
  },

  update: async (id: string, data: Partial<RepairTicket>) => {
    const { data: result, error } = await supabase
      .from('repair_tickets')
      .update(data)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return mapRepair(result as Record<string, unknown>)
  },

  delete: async (id: string) => {
    const { error } = await supabase
      .from('repair_tickets')
      .delete()
      .eq('id', id)
    if (error) throw error
    return { success: true }
  },

  updateStatus: async (id: string, status: string, note?: string) => {
    const { data: repair, error } = await supabase
      .from('repair_tickets')
      .select('status')
      .eq('id', id)
      .single()
    if (error) throw error

    const oldStatus = repair.status

    const { data: result, error: updateError } = await supabase
      .from('repair_tickets')
      .update({ status })
      .eq('id', id)
      .select()
      .single()
    if (updateError) throw updateError

    await supabase
      .from('repair_status_history')
      .insert({
        repair: id,
        old_status: oldStatus,
        new_status: status,
        note: note || '',
      })

    return mapRepair(result as Record<string, unknown>)
  },

  statusHistory: async (id: string) => {
    const { data, error } = await supabase
      .from('repair_status_history')
      .select('*')
      .eq('repair', id)
      .order('created_at', { ascending: false })
    if (error) throw error
    return data as RepairStatusHistory[]
  },

  addPart: async (id: string, data: { product: string; quantity: number; unit_price: number }) => {
    const { data: result, error } = await supabase
      .from('repair_parts')
      .insert({
        repair: id,
        product: data.product,
        quantity: data.quantity,
        unit_price: data.unit_price,
        total_price: data.unit_price * data.quantity,
      })
      .select()
      .single()
    if (error) throw error

    // Update product stock
    const { data: product } = await supabase
      .from('products')
      .select('stock_quantity')
      .eq('id', data.product)
      .single()

    if (product) {
      await supabase
        .from('products')
        .update({ stock_quantity: Number(product.stock_quantity) - data.quantity })
        .eq('id', data.product)
    }

    return result as RepairPart
  },

  removePart: async (id: string, partId: string) => {
    const { error } = await supabase
      .from('repair_parts')
      .delete()
      .eq('id', partId)
      .eq('repair', id)
    if (error) throw error
    return { success: true }
  },

  addImage: async (id: string, imageUrl: string, caption?: string) => {
    const { data, error } = await supabase
      .from('repair_images')
      .insert({
        repair: id,
        image: imageUrl,
        caption: caption || '',
      })
      .select()
      .single()
    if (error) throw error
    return data as RepairImage
  },

  removeImage: async (id: string, imageId: string) => {
    const { error } = await supabase
      .from('repair_images')
      .delete()
      .eq('id', imageId)
      .eq('repair', id)
    if (error) throw error
    return { success: true }
  },

  myRepairs: async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { data, error } = await supabase
      .from('repair_tickets')
      .select(`
        *,
        customer:customers(*),
        device:devices(*),
        technician:employees(*),
        parts:repair_parts(*),
        images:repair_images(*),
        status_history:repair_status_history(*)
      `)
      .eq('technician', user.id)
      .order('created_at', { ascending: false })
    if (error) throw error
    return (data || []).map(mapRepair)
  },

  dashboardStats: async () => {
    const { data, error } = await supabase
      .from('repair_tickets')
      .select('status', { count: 'exact' })
    if (error) throw error

    const stats: Record<string, number> = {}
    ;(data || []).forEach((r: Record<string, unknown>) => {
      const status = r.status as string
      stats[status] = (stats[status] || 0) + 1
    })

    return {
      total: data?.length || 0,
      by_status: stats,
    }
  },
}

export const publicRepairsApi = {
  track: async (matricule: string) => {
    const { data, error } = await supabase
      .from('public_repair_tracking')
      .select('*')
      .eq('matricule', matricule)
      .single()
    if (error) throw error
    return data as PublicRepairTracking
  },

  history: async (matricule: string) => {
    const { data, error } = await supabase
      .from('repair_tickets')
      .select(`
        *,
        status_history:repair_status_history(*)
      `)
      .eq('tracking_matricule', matricule)
      .single()
    if (error) throw error
    return mapRepair(data as Record<string, unknown>)
  },
}
