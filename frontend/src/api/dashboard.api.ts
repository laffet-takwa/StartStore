import { supabase, toPaginated } from '@/lib/supabase'
import type { Notification, PaginatedResponse, DashboardOverview, AuditLog } from '@/types'

const NOTIFICATION_TYPE_LABELS: Record<string, string> = {
  info: 'Information',
  warning: 'Avertissement',
  success: 'Succès',
  error: 'Erreur',
  low_stock: 'Stock faible',
  repair_ready: 'Réparation prête',
  repair_assigned: 'Réparation assignée',
  repair_waiting: 'En attente client',
  payment_pending: 'Paiement en attente',
}

function mapNotification(n: Record<string, unknown>): Notification {
  return {
    ...n,
    type_label: NOTIFICATION_TYPE_LABELS[n.type as string] || (n.type as string),
  } as Notification
}

export const notificationsApi = {
  list: async (params?: Record<string, unknown>) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    let query = supabase
      .from('notifications')
      .select('*', { count: 'exact' })
      .eq('employee', user.id)

    if (params?.is_read !== undefined) {
      query = query.eq('is_read', params.is_read)
    }
    if (params?.type) {
      query = query.eq('type', params.type)
    }

    const page = Number(params?.page) || 1
    const limit = Number(params?.limit) || 20
    const from = (page - 1) * limit
    const to = from + limit - 1

    query = query.range(from, to).order('created_at', { ascending: false })

    const { data, error, count } = await query
    if (error) throw error

    const notifications = (data || []).map(mapNotification)
    return toPaginated(notifications, count || 0, page, limit) as unknown as PaginatedResponse<Notification>
  },

  markRead: async (id: string) => {
    const { data, error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return mapNotification(data as Record<string, unknown>)
  },

  markAllRead: async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('employee', user.id)
      .eq('is_read', false)
    if (error) throw error
    return { success: true }
  },

  unreadCount: async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('employee', user.id)
      .eq('is_read', false)
    if (error) throw error
    return { unread_count: count || 0 }
  },
}

export const dashboardApi = {
  overview: async (): Promise<DashboardOverview> => {
    // Revenue stats
    const { data: sales } = await supabase
      .from('sales')
      .select('total, status, created_at')
      .eq('status', 'confirmed')

    const total = (sales || []).reduce((sum: number, s: Record<string, unknown>) => sum + Number(s.total || 0), 0)
    const today = new Date().toISOString().split('T')[0]
    const todaySales = (sales || []).filter((s: Record<string, unknown>) =>
      (s.created_at as string).startsWith(today))
    const todayTotal = todaySales.reduce((sum: number, s: Record<string, unknown>) => sum + Number(s.total || 0), 0)

    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
    const monthSales = (sales || []).filter((s: Record<string, unknown>) =>
      (s.created_at as string) >= monthStart)
    const monthTotal = monthSales.reduce((sum: number, s: Record<string, unknown>) => sum + Number(s.total || 0), 0)

    const yearStart = new Date(now.getFullYear(), 0, 1).toISOString()
    const yearSales = (sales || []).filter((s: Record<string, unknown>) =>
      (s.created_at as string) >= yearStart)
    const yearTotal = yearSales.reduce((sum: number, s: Record<string, unknown>) => sum + Number(s.total || 0), 0)

    // Revenue last 7 days
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
    const recentSales = (sales || []).filter((s: Record<string, unknown>) =>
      (s.created_at as string) >= sevenDaysAgo)
    const revenue7days: { date: string; total: number }[] = []
    const dailyTotals: Record<string, number> = {}
    ;(recentSales || []).forEach((s: Record<string, unknown>) => {
      const date = (s.created_at as string).split('T')[0]
      dailyTotals[date] = (dailyTotals[date] || 0) + Number(s.total || 0)
    })
    Object.entries(dailyTotals).forEach(([date, total]) => {
      revenue7days.push({ date, total })
    })
    revenue7days.sort((a, b) => a.date.localeCompare(b.date))

    // Customers
    const { count: customersTotal } = await supabase
      .from('customers')
      .select('*', { count: 'exact', head: true })

    const { count: customersNew } = await supabase
      .from('customers')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', monthStart)

    // Repairs
    const { data: repairs } = await supabase
      .from('repair_tickets')
      .select('status')

    const activeRepairs = (repairs || []).filter((r: Record<string, unknown>) =>
      !['delivered', 'cancelled'].includes(r.status as string)).length
    const completedRepairs = (repairs || []).filter((r: Record<string, unknown>) =>
      r.status === 'delivered').length
    const pendingRepairs = (repairs || []).filter((r: Record<string, unknown>) =>
      r.status === 'received').length
    const inProgressRepairs = (repairs || []).filter((r: Record<string, unknown>) =>
      ['repairing', 'testing'].includes(r.status as string)).length
    const readyRepairs = (repairs || []).filter((r: Record<string, unknown>) =>
      r.status === 'ready').length

    // Repairs by status
    const repairsByStatus: { status: string; label: string; count: number }[] = []
    const statusCounts: Record<string, number> = {}
    ;(repairs || []).forEach((r: Record<string, unknown>) => {
      const status = r.status as string
      statusCounts[status] = (statusCounts[status] || 0) + 1
    })
    const statusLabels: Record<string, string> = {
      received: 'Reçu',
      diagnosis: 'Diagnostic',
      waiting_customer: 'En attente du client',
      approved: 'Approuvée',
      repairing: 'En réparation',
      testing: 'Test en cours',
      ready: 'Prêt',
      delivered: 'Livré',
      cancelled: 'Annulé',
    }
    Object.entries(statusCounts).forEach(([status, count]) => {
      repairsByStatus.push({ status, label: statusLabels[status] || status, count })
    })

    // Inventory
    const { data: products } = await supabase
      .from('products')
      .select('stock_quantity, minimum_stock')

    const totalProducts = products?.length || 0
    const lowStock = (products || []).filter((p: Record<string, unknown>) =>
      Number(p.stock_quantity) <= Number(p.minimum_stock)).length
    const outOfStock = (products || []).filter((p: Record<string, unknown>) =>
      Number(p.stock_quantity) === 0).length

    // Recent repairs
    const { data: recentRepairs } = await supabase
      .from('repair_tickets')
      .select(`
        *,
        customer:customers(*),
        device:devices(*),
        technician:employees(*)
      `)
      .order('created_at', { ascending: false })
      .limit(5)

    // Recent sales
    const { data: recentSalesData } = await supabase
      .from('sales')
      .select(`
        *,
        customer:customers(*),
        employee:employees(*),
        items:sale_items(*),
        payments:payments(*)
      `)
      .order('created_at', { ascending: false })
      .limit(5)

    // Low stock products
    const { data: lowStockProducts } = await supabase
      .from('products')
      .select(`
        *,
        category:categories(*),
        supplier:suppliers(*)
      `)
      .lte('stock_quantity', 5)
      .order('stock_quantity', { ascending: true })
      .limit(10)

    return {
      revenue: {
        total,
        today: todayTotal,
        month: monthTotal,
        year: yearTotal,
      },
      revenue_7days: revenue7days,
      customers: {
        total: customersTotal || 0,
        new_this_month: customersNew || 0,
      },
      repairs: {
        active: activeRepairs,
        completed: completedRepairs,
        pending: pendingRepairs,
        in_progress: inProgressRepairs,
        ready: readyRepairs,
      },
      repairs_by_status: repairsByStatus,
      inventory: {
        total_products: totalProducts,
        low_stock: lowStock,
        out_of_stock: outOfStock,
      },
      recent_repairs: (recentRepairs || []) as DashboardOverview['recent_repairs'],
      recent_sales: (recentSalesData || []) as DashboardOverview['recent_sales'],
      low_stock_products: (lowStockProducts || []) as DashboardOverview['low_stock_products'],
    }
  },
}

export const reportsApi = {
  sales: async (params?: Record<string, unknown>) => {
    let query = supabase
      .from('sales')
      .select(`
        *,
        customer:customers(*),
        employee:employees(*),
        items:sale_items(*),
        payments:payments(*)
      `)
      .eq('status', 'confirmed')

    if (params?.start_date) {
      query = query.gte('created_at', params.start_date)
    }
    if (params?.end_date) {
      query = query.lte('created_at', params.end_date)
    }

    const { data, error } = await query.order('created_at', { ascending: false })
    if (error) throw error
    return data
  },

  repairs: async (params?: Record<string, unknown>) => {
    let query = supabase
      .from('repair_tickets')
      .select(`
        *,
        customer:customers(*),
        device:devices(*),
        technician:employees(*)
      `)

    if (params?.start_date) {
      query = query.gte('created_at', params.start_date)
    }
    if (params?.end_date) {
      query = query.lte('created_at', params.end_date)
    }
    if (params?.status) {
      query = query.eq('status', params.status)
    }

    const { data, error } = await query.order('created_at', { ascending: false })
    if (error) throw error
    return data
  },

  inventory: async (params?: Record<string, unknown>) => {
    let query = supabase
      .from('inventory_movements')
      .select(`
        *,
        product:products(name, sku)
      `)

    if (params?.start_date) {
      query = query.gte('created_at', params.start_date)
    }
    if (params?.end_date) {
      query = query.lte('created_at', params.end_date)
    }
    if (params?.movement_type) {
      query = query.eq('movement_type', params.movement_type)
    }

    const { data, error } = await query.order('created_at', { ascending: false })
    if (error) throw error
    return data
  },

  customers: async (params?: Record<string, unknown>) => {
    let query = supabase
      .from('customers')
      .select(`
        *,
        devices:devices(count),
        repairs:repair_tickets(count),
        sales:sales(count)
      `)

    if (params?.start_date) {
      query = query.gte('created_at', params.start_date)
    }
    if (params?.end_date) {
      query = query.lte('created_at', params.end_date)
    }

    const { data, error } = await query.order('created_at', { ascending: false })
    if (error) throw error
    return data
  },
}

const AUDIT_ACTION_LABELS: Record<string, string> = {
  create: 'Création',
  update: 'Modification',
  delete: 'Suppression',
  status_change: 'Changement de statut',
  login: 'Connexion',
  logout: 'Déconnexion',
  confirm: 'Confirmation',
  cancel: 'Annulation',
  payment: 'Paiement',
  invoice: 'Facturation',
  inventory_adjustment: 'Ajustement stock',
  export: 'Export',
}

export const auditApi = {
  list: async (params?: Record<string, unknown>) => {
    let query = supabase
      .from('audit_logs')
      .select(`
        *,
        employee:employees(*)
      `, { count: 'exact' })

    if (params?.action) {
      query = query.eq('action', params.action)
    }
    if (params?.entity_type) {
      query = query.eq('entity_type', params.entity_type)
    }
    if (params?.entity_id) {
      query = query.eq('entity_id', params.entity_id)
    }

    const page = Number(params?.page) || 1
    const limit = Number(params?.limit) || 20
    const from = (page - 1) * limit
    const to = from + limit - 1

    query = query.range(from, to).order('created_at', { ascending: false })

    const { data, error, count } = await query
    if (error) throw error

    const logs = (data || []).map((l: Record<string, unknown>) => ({
      ...l,
      action_label: AUDIT_ACTION_LABELS[l.action as string] || (l.action as string),
      employee: l.employee as AuditLog['employee'],
    })) as unknown as AuditLog[]

    return toPaginated(logs, count || 0, page, limit) as unknown as PaginatedResponse<AuditLog>
  },

  entityHistory: async (params: { entity_type: string; entity_id: string }) => {
    const { data, error } = await supabase
      .from('audit_logs')
      .select(`
        *,
        employee:employees(*)
      `)
      .eq('entity_type', params.entity_type)
      .eq('entity_id', params.entity_id)
      .order('created_at', { ascending: false })
    if (error) throw error
    return data
  },
}
