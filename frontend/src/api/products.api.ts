import { supabase, toPaginated, type SupabasePaginated } from '@/lib/supabase'
import type { Product, Category, Supplier, PaginatedResponse, InventoryMovement } from '@/types'

// Helper to map Supabase product to API format
function mapProduct(p: Record<string, unknown>): Product {
  return {
    ...p,
    category: (p.category as Record<string, unknown>) || undefined,
    supplier: (p.supplier as Record<string, unknown>) || undefined,
    category_name: (p.category as Record<string, unknown>)?.name as string | undefined,
    supplier_name: (p.supplier as Record<string, unknown>)?.name as string | undefined,
    is_low_stock: Number(p.stock_quantity) <= Number(p.minimum_stock),
    stock_value: Number(p.stock_quantity) * Number(p.purchase_price),
  } as Product
}

export const productsApi = {
  list: async (params?: Record<string, unknown>) => {
    let query = supabase
      .from('products')
      .select(`
        *,
        category:categories(*),
        supplier:suppliers(*)
      `, { count: 'exact' })

    if (params?.search) {
      query = query.or(`name.ilike.%${params.search}%,sku.ilike.%${params.search}%,brand.ilike.%${params.search}%`)
    }
    if (params?.category) {
      query = query.eq('category', params.category)
    }
    if (params?.is_active !== undefined) {
      query = query.eq('is_active', params.is_active)
    }
    if (params?.low_stock === 'true') {
      query = query.lte('stock_quantity', 5)
    }

    const page = Number(params?.page) || 1
    const limit = Number(params?.limit) || 20
    const from = (page - 1) * limit
    const to = from + limit - 1

    query = query.range(from, to).order('created_at', { ascending: false })

    const { data, error, count } = await query
    if (error) throw error

    const products = (data || []).map(mapProduct)
    return toPaginated(products, count || 0, page, limit) as unknown as PaginatedResponse<Product>
  },

  get: async (id: string) => {
    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        category:categories(*),
        supplier:suppliers(*),
        images:product_images(*)
      `)
      .eq('id', id)
      .single()
    if (error) throw error
    return mapProduct(data as Record<string, unknown>)
  },

  create: async (data: Partial<Product>) => {
    const { data: result, error } = await supabase
      .from('products')
      .insert(data)
      .select()
      .single()
    if (error) throw error
    return mapProduct(result as Record<string, unknown>)
  },

  update: async (id: string, data: Partial<Product>) => {
    const { data: result, error } = await supabase
      .from('products')
      .update(data)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return mapProduct(result as Record<string, unknown>)
  },

  delete: async (id: string) => {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id)
    if (error) throw error
    return { success: true }
  },

  lowStock: async () => {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .lte('stock_quantity', 5)
      .order('stock_quantity', { ascending: true })
    if (error) throw error
    return (data || []).map(mapProduct)
  },
}

export const categoriesApi = {
  list: async (params?: Record<string, unknown>) => {
    let query = supabase
      .from('categories')
      .select(`
        *,
        products:products(count)
      `, { count: 'exact' })

    if (params?.search) {
      query = query.or(`name.ilike.%${params.search}%,slug.ilike.%${params.search}%`)
    }
    if (params?.is_active !== undefined) {
      query = query.eq('is_active', params.is_active)
    }

    const page = Number(params?.page) || 1
    const limit = Number(params?.limit) || 20
    const from = (page - 1) * limit
    const to = from + limit - 1

    query = query.range(from, to).order('name', { ascending: true })

    const { data, error, count } = await query
    if (error) throw error

    const categories = (data || []).map((c: Record<string, unknown>) => ({
      ...c,
      product_count: Array.isArray(c.products) ? c.products.length : 0,
    })) as unknown as Category[]

    return toPaginated(categories, count || 0, page, limit) as unknown as PaginatedResponse<Category>
  },

  get: async (id: string) => {
    const { data, error } = await supabase
      .from('categories')
      .select(`
        *,
        products:products(count)
      `)
      .eq('id', id)
      .single()
    if (error) throw error
    return {
      ...data,
      product_count: Array.isArray(data.products) ? data.products.length : 0,
    } as Category
  },

  create: async (data: Partial<Category>) => {
    const { data: result, error } = await supabase
      .from('categories')
      .insert(data)
      .select()
      .single()
    if (error) throw error
    return result as Category
  },

  update: async (id: string, data: Partial<Category>) => {
    const { data: result, error } = await supabase
      .from('categories')
      .update(data)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return result as Category
  },

  delete: async (id: string) => {
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id)
    if (error) throw error
    return { success: true }
  },
}

export const suppliersApi = {
  list: async (params?: Record<string, unknown>) => {
    let query = supabase
      .from('suppliers')
      .select(`
        *,
        products:products(count)
      `, { count: 'exact' })

    if (params?.search) {
      query = query.or(`name.ilike.%${params.search}%,contact_person.ilike.%${params.search}%`)
    }
    if (params?.is_active !== undefined) {
      query = query.eq('is_active', params.is_active)
    }

    const page = Number(params?.page) || 1
    const limit = Number(params?.limit) || 20
    const from = (page - 1) * limit
    const to = from + limit - 1

    query = query.range(from, to).order('name', { ascending: true })

    const { data, error, count } = await query
    if (error) throw error

    const suppliers = (data || []).map((s: Record<string, unknown>) => ({
      ...s,
      product_count: Array.isArray(s.products) ? s.products.length : 0,
    })) as unknown as Supplier[]

    return toPaginated(suppliers, count || 0, page, limit) as unknown as PaginatedResponse<Supplier>
  },

  get: async (id: string) => {
    const { data, error } = await supabase
      .from('suppliers')
      .select(`
        *,
        products:products(count)
      `)
      .eq('id', id)
      .single()
    if (error) throw error
    return {
      ...data,
      product_count: Array.isArray(data.products) ? data.products.length : 0,
    } as Supplier
  },

  create: async (data: Partial<Supplier>) => {
    const { data: result, error } = await supabase
      .from('suppliers')
      .insert(data)
      .select()
      .single()
    if (error) throw error
    return result as Supplier
  },

  update: async (id: string, data: Partial<Supplier>) => {
    const { data: result, error } = await supabase
      .from('suppliers')
      .update(data)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return result as Supplier
  },

  delete: async (id: string) => {
    const { error } = await supabase
      .from('suppliers')
      .delete()
      .eq('id', id)
    if (error) throw error
    return { success: true }
  },
}

// Public (unauthenticated) storefront catalog — safe read-only data only.
export const publicProductsApi = {
  list: async (params?: Record<string, unknown>) => {
    let query = supabase
      .from('products')
      .select(`
        *,
        category:categories(*),
        supplier:suppliers(*)
      `, { count: 'exact' })
      .eq('is_active', true)

    if (params?.search) {
      query = query.or(`name.ilike.%${params.search}%,sku.ilike.%${params.search}%,brand.ilike.%${params.search}%`)
    }
    if (params?.category) {
      query = query.eq('category', params.category)
    }

    const page = Number(params?.page) || 1
    const limit = Number(params?.limit) || 20
    const from = (page - 1) * limit
    const to = from + limit - 1

    query = query.range(from, to).order('created_at', { ascending: false })

    const { data, error, count } = await query
    if (error) throw error

    const products = (data || []).map(mapProduct)
    return toPaginated(products, count || 0, page, limit) as unknown as PaginatedResponse<Product>
  },

  get: async (id: string) => {
    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        category:categories(*),
        supplier:suppliers(*),
        images:product_images(*)
      `)
      .eq('id', id)
      .eq('is_active', true)
      .single()
    if (error) throw error
    return mapProduct(data as Record<string, unknown>)
  },
}

export const publicCategoriesApi = {
  list: async (params?: Record<string, unknown>) => {
    let query = supabase
      .from('categories')
      .select(`
        *,
        products:products(count)
      `, { count: 'exact' })
      .eq('is_active', true)

    if (params?.search) {
      query = query.or(`name.ilike.%${params.search}%,slug.ilike.%${params.search}%`)
    }

    const page = Number(params?.page) || 1
    const limit = Number(params?.limit) || 20
    const from = (page - 1) * limit
    const to = from + limit - 1

    query = query.range(from, to).order('name', { ascending: true })

    const { data, error, count } = await query
    if (error) throw error

    const categories = (data || []).map((c: Record<string, unknown>) => ({
      ...c,
      product_count: Array.isArray(c.products) ? c.products.length : 0,
    })) as unknown as Category[]

    return toPaginated(categories, count || 0, page, limit) as unknown as PaginatedResponse<Category>
  },

  get: async (id: string) => {
    const { data, error } = await supabase
      .from('categories')
      .select(`
        *,
        products:products(count)
      `)
      .eq('id', id)
      .eq('is_active', true)
      .single()
    if (error) throw error
    return {
      ...data,
      product_count: Array.isArray(data.products) ? data.products.length : 0,
    } as Category
  },
}

export const inventoryApi = {
  movements: async (params?: Record<string, unknown>) => {
    let query = supabase
      .from('inventory_movements')
      .select(`
        *,
        product:products(name, sku)
      `, { count: 'exact' })

    if (params?.product) {
      query = query.eq('product', params.product)
    }
    if (params?.movement_type) {
      query = query.eq('movement_type', params.movement_type)
    }

    const page = Number(params?.page) || 1
    const limit = Number(params?.limit) || 20
    const from = (page - 1) * limit
    const to = from + limit - 1

    query = query.range(from, to).order('created_at', { ascending: false })

    const { data, error, count } = await query
    if (error) throw error

    const movements = (data || []).map((m: Record<string, unknown>) => ({
      ...m,
      product_name: (m.product as Record<string, unknown>)?.name as string,
      product_sku: (m.product as Record<string, unknown>)?.sku as string,
    })) as unknown as InventoryMovement[]

    return toPaginated(movements, count || 0, page, limit) as unknown as PaginatedResponse<InventoryMovement>
  },

  lowStock: async () => {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .lte('stock_quantity', 5)
    if (error) throw error
    return data
  },

  adjust: async (data: { product_id: string; quantity: number; reason: string }) => {
    const { data: result, error } = await supabase
      .from('inventory_movements')
      .insert({
        product: data.product_id,
        movement_type: 'adjustment',
        quantity: data.quantity,
        reason: data.reason,
      })
      .select()
      .single()
    if (error) throw error

    // Update product stock
    const { data: product } = await supabase
      .from('products')
      .select('stock_quantity')
      .eq('id', data.product_id)
      .single()

    if (product) {
      await supabase
        .from('products')
        .update({ stock_quantity: Number(product.stock_quantity) + data.quantity })
        .eq('id', data.product_id)
    }

    return result
  },
}
