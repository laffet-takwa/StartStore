import { supabase, toPaginated } from '@/lib/supabase'
import type { Invoice, PaginatedResponse } from '@/types'

export const invoicesApi = {
  list: async (params?: Record<string, unknown>) => {
    let query = supabase
      .from('invoices')
      .select(`
        *,
        customer:customers(*),
        sale:sales(*),
        repair:repair_tickets(*)
      `, { count: 'exact' })

    if (params?.search) {
      query = query.or(`invoice_number.ilike.%${params.search}%`)
    }
    if (params?.customer) {
      query = query.eq('customer', params.customer)
    }

    const page = Number(params?.page) || 1
    const limit = Number(params?.limit) || 20
    const from = (page - 1) * limit
    const to = from + limit - 1

    query = query.range(from, to).order('issued_at', { ascending: false })

    const { data, error, count } = await query
    if (error) throw error

    const invoices = (data || []).map((i: Record<string, unknown>) => ({
      ...i,
      customer: i.customer as Invoice['customer'],
      sale: i.sale as Invoice['sale'],
      repair: i.repair as Invoice['repair'],
    })) as unknown as Invoice[]

    return toPaginated(invoices, count || 0, page, limit) as unknown as PaginatedResponse<Invoice>
  },

  get: async (id: string) => {
    const { data, error } = await supabase
      .from('invoices')
      .select(`
        *,
        customer:customers(*),
        sale:sales(*),
        repair:repair_tickets(*)
      `)
      .eq('id', id)
      .single()
    if (error) throw error
    return {
      ...data,
      customer: data.customer as Invoice['customer'],
      sale: data.sale as Invoice['sale'],
      repair: data.repair as Invoice['repair'],
    } as Invoice
  },

  create: async (data: { sale_id?: string; repair_id?: string; notes?: string }) => {
    let invoiceData: Record<string, unknown> = {
      notes: data.notes || '',
    }

    if (data.sale_id) {
      const { data: sale, error: saleError } = await supabase
        .from('sales')
        .select('customer, subtotal, discount, tax, total')
        .eq('id', data.sale_id)
        .single()
      if (saleError) throw saleError

      invoiceData = {
        ...invoiceData,
        customer: sale.customer,
        sale: data.sale_id,
        subtotal: sale.subtotal,
        discount: sale.discount,
        tax: sale.tax,
        total: sale.total,
      }
    } else if (data.repair_id) {
      const { data: repair, error: repairError } = await supabase
        .from('repair_tickets')
        .select('customer, final_cost, estimated_cost')
        .eq('id', data.repair_id)
        .single()
      if (repairError) throw repairError

      const finalCost = repair.final_cost || repair.estimated_cost || 0
      invoiceData = {
        ...invoiceData,
        customer: repair.customer,
        repair: data.repair_id,
        subtotal: finalCost,
        discount: 0,
        tax: 0,
        total: finalCost,
      }
    }

    const { data: result, error } = await supabase
      .from('invoices')
      .insert(invoiceData)
      .select()
      .single()
    if (error) throw error
    return result as Invoice
  },

  downloadPdf: async (id: string) => {
    const { data, error } = await supabase
      .from('invoices')
      .select('*')
      .eq('id', id)
      .single()
    if (error) throw error
    return data
  },
}
