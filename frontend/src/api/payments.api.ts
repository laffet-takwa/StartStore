import { supabase, toPaginated } from '@/lib/supabase'
import type { Payment, PaginatedResponse } from '@/types'

const METHOD_LABELS: Record<string, string> = {
  cash: 'Espèces',
  card: 'Carte bancaire',
  bank_transfer: 'Virement bancaire',
  other: 'Autre',
}

function mapPayment(p: Record<string, unknown>): Payment {
  return {
    ...p,
    payment_method_label: METHOD_LABELS[p.payment_method as string] || (p.payment_method as string),
    sale: p.sale as Payment['sale'],
    repair: p.repair as Payment['repair'],
  } as Payment
}

export const paymentsApi = {
  list: async (params?: Record<string, unknown>) => {
    let query = supabase
      .from('payments')
      .select(`
        *,
        sale:sales(*),
        repair:repair_tickets(*)
      `, { count: 'exact' })

    if (params?.payment_method) {
      query = query.eq('payment_method', params.payment_method)
    }
    if (params?.sale) {
      query = query.eq('sale', params.sale)
    }
    if (params?.repair) {
      query = query.eq('repair', params.repair)
    }

    const page = Number(params?.page) || 1
    const limit = Number(params?.limit) || 20
    const from = (page - 1) * limit
    const to = from + limit - 1

    query = query.range(from, to).order('paid_at', { ascending: false })

    const { data, error, count } = await query
    if (error) throw error

    const payments = (data || []).map(mapPayment)
    return toPaginated(payments, count || 0, page, limit) as unknown as PaginatedResponse<Payment>
  },

  get: async (id: string) => {
    const { data, error } = await supabase
      .from('payments')
      .select(`
        *,
        sale:sales(*),
        repair:repair_tickets(*)
      `)
      .eq('id', id)
      .single()
    if (error) throw error
    return mapPayment(data as Record<string, unknown>)
  },

  create: async (data: Partial<Payment>) => {
    const { data: result, error } = await supabase
      .from('payments')
      .insert(data)
      .select()
      .single()
    if (error) throw error

    // Update sale payment status if linked to a sale
    if (data.sale) {
      const { data: sale } = await supabase
        .from('sales')
        .select('total')
        .eq('id', data.sale)
        .single()

      if (sale) {
        const { data: payments } = await supabase
          .from('payments')
          .select('amount')
          .eq('sale', data.sale)

        const paidAmount = (payments || []).reduce((sum: number, p: Record<string, unknown>) =>
          sum + Number(p.amount || 0), 0)

        let paymentStatus = 'unpaid'
        if (paidAmount >= Number(sale.total)) {
          paymentStatus = 'paid'
        } else if (paidAmount > 0) {
          paymentStatus = 'partial'
        }

        await supabase
          .from('sales')
          .update({ payment_status: paymentStatus })
          .eq('id', data.sale)
      }
    }

    return mapPayment(result as Record<string, unknown>)
  },
}
