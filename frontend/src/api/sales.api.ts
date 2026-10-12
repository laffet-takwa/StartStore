import { supabase, toPaginated } from '@/lib/supabase'
import type { Sale, PaginatedResponse } from '@/types'

const STATUS_LABELS: Record<string, string> = {
  draft: 'Brouillon',
  confirmed: 'Confirmé',
  cancelled: 'Annulé',
}

const PAYMENT_STATUS_LABELS: Record<string, string> = {
  unpaid: 'Non payé',
  partial: 'Partiellement payé',
  paid: 'Payé',
  refunded: 'Remboursé',
}

function mapSale(s: Record<string, unknown>): Sale {
  const status = s.status as string
  const paymentStatus = s.payment_status as string
  const items = (s.items as Array<Record<string, unknown>>) || []
  const payments = (s.payments as Array<Record<string, unknown>>) || []
  const paidAmount = payments.reduce((sum, p) => sum + Number(p.amount || 0), 0)

  return {
    ...s,
    status_label: STATUS_LABELS[status] || status,
    payment_status_label: PAYMENT_STATUS_LABELS[paymentStatus] || paymentStatus,
    customer_name: s.customer
      ? `${(s.customer as Record<string, unknown>).first_name || ''} ${(s.customer as Record<string, unknown>).last_name || ''}`.trim()
      : '',
    employee_name: s.employee
      ? `${(s.employee as Record<string, unknown>).first_name || ''} ${(s.employee as Record<string, unknown>).last_name || ''}`.trim()
      : '',
    items: items as unknown as Sale['items'],
    payments: payments as unknown as Sale['payments'],
    paid_amount: paidAmount,
    remaining_amount: Number(s.total || 0) - paidAmount,
    items_count: items.length,
  } as Sale
}

export const salesApi = {
  list: async (params?: Record<string, unknown>) => {
    let query = supabase
      .from('sales')
      .select(`
        *,
        customer:customers(*),
        employee:employees(*),
        items:sale_items(*),
        payments:payments(*)
      `, { count: 'exact' })

    if (params?.search) {
      query = query.or(`sale_number.ilike.%${params.search}%`)
    }
    if (params?.status) {
      query = query.eq('status', params.status)
    }
    if (params?.payment_status) {
      query = query.eq('payment_status', params.payment_status)
    }
    if (params?.customer) {
      query = query.eq('customer', params.customer)
    }

    const page = Number(params?.page) || 1
    const limit = Number(params?.limit) || 20
    const from = (page - 1) * limit
    const to = from + limit - 1

    query = query.range(from, to).order('created_at', { ascending: false })

    const { data, error, count } = await query
    if (error) throw error

    const sales = (data || []).map(mapSale)
    return toPaginated(sales, count || 0, page, limit) as unknown as PaginatedResponse<Sale>
  },

  get: async (id: string) => {
    const { data, error } = await supabase
      .from('sales')
      .select(`
        *,
        customer:customers(*),
        employee:employees(*),
        items:sale_items(*),
        payments:payments(*)
      `)
      .eq('id', id)
      .single()
    if (error) throw error
    return mapSale(data as Record<string, unknown>)
  },

  create: async (data: Partial<Sale>) => {
    const { data: result, error } = await supabase
      .from('sales')
      .insert(data)
      .select()
      .single()
    if (error) throw error
    return mapSale(result as Record<string, unknown>)
  },

  update: async (id: string, data: Partial<Sale>) => {
    const { data: result, error } = await supabase
      .from('sales')
      .update(data)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return mapSale(result as Record<string, unknown>)
  },

  confirm: async (id: string) => {
    const { data, error } = await supabase
      .from('sales')
      .update({ status: 'confirmed', confirmed_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return mapSale(data as Record<string, unknown>)
  },

  cancel: async (id: string) => {
    const { data, error } = await supabase
      .from('sales')
      .update({ status: 'cancelled', cancelled_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return mapSale(data as Record<string, unknown>)
  },

  dashboardStats: async () => {
    const { data, error } = await supabase
      .from('sales')
      .select('status, payment_status, total', { count: 'exact' })
    if (error) throw error

    const stats = {
      total: data?.length || 0,
      total_revenue: (data || []).reduce((sum: number, s: Record<string, unknown>) =>
        s.status === 'confirmed' ? sum + Number(s.total || 0) : sum, 0),
      by_status: {} as Record<string, number>,
      by_payment_status: {} as Record<string, number>,
    }

    ;(data || []).forEach((s: Record<string, unknown>) => {
      const status = s.status as string
      const paymentStatus = s.payment_status as string
      stats.by_status[status] = (stats.by_status[status] || 0) + 1
      stats.by_payment_status[paymentStatus] = (stats.by_payment_status[paymentStatus] || 0) + 1
    })

    return stats
  },
}
