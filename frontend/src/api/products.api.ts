import api from '@/api/axios'
import type { Product, Category, Supplier, PaginatedResponse, InventoryMovement } from '@/types'

export const productsApi = {
  list: (params?: Record<string, unknown>) =>
    api.get<PaginatedResponse<Product>>('/products/', { params }).then((r) => r.data),

  get: (id: string) => api.get<Product>(`/products/${id}/`).then((r) => r.data),

  create: (data: Partial<Product>) => api.post<Product>('/products/', data).then((r) => r.data),

  update: (id: string, data: Partial<Product>) =>
    api.patch<Product>(`/products/${id}/`, data).then((r) => r.data),

  delete: (id: string) => api.delete(`/products/${id}/`).then((r) => r.data),

  lowStock: () => api.get<Product[]>('/products/low_stock/').then((r) => r.data),
}

export const categoriesApi = {
  list: (params?: Record<string, unknown>) =>
    api.get<PaginatedResponse<Category>>('/categories/', { params }).then((r) => r.data),

  get: (id: string) => api.get<Category>(`/categories/${id}/`).then((r) => r.data),

  create: (data: Partial<Category>) => api.post<Category>('/categories/', data).then((r) => r.data),

  update: (id: string, data: Partial<Category>) =>
    api.patch<Category>(`/categories/${id}/`, data).then((r) => r.data),

  delete: (id: string) => api.delete(`/categories/${id}/`).then((r) => r.data),
}

export const suppliersApi = {
  list: (params?: Record<string, unknown>) =>
    api.get<PaginatedResponse<Supplier>>('/suppliers/', { params }).then((r) => r.data),

  get: (id: string) => api.get<Supplier>(`/suppliers/${id}/`).then((r) => r.data),

  create: (data: Partial<Supplier>) => api.post<Supplier>('/suppliers/', data).then((r) => r.data),

  update: (id: string, data: Partial<Supplier>) =>
    api.patch<Supplier>(`/suppliers/${id}/`, data).then((r) => r.data),

  delete: (id: string) => api.delete(`/suppliers/${id}/`).then((r) => r.data),
}

export const inventoryApi = {
  movements: (params?: Record<string, unknown>) =>
    api.get<PaginatedResponse<InventoryMovement>>('/inventory/movements/', { params }).then((r) => r.data),

  lowStock: () => api.get('/inventory/low-stock/').then((r) => r.data),

  adjust: (data: { product_id: string; quantity: number; reason: string }) =>
    api.post('/inventory/adjust/', data).then((r) => r.data),
}