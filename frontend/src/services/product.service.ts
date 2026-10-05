import { del, get, patch, patchForm, post, postForm } from './api'
import type {
  Category,
  CategoryInput,
  Paginated,
  Product,
  ProductImage,
  ProductImageInput,
  ProductInput,
  ProductQuery,
  ProductStockUpdate,
  ProductSummaryTotals,
} from '@/types'

/** Flatten a product payload into multipart, omitting empty values. */
function toFormData(payload: Partial<ProductInput> & { image?: File | null }): FormData {
  const form = new FormData()
  for (const [key, value] of Object.entries(payload)) {
    if (value === undefined || value === null || value === '') continue
    if (key === 'image') {
      form.append('image', value as File)
    } else if (typeof value === 'boolean') {
      form.append(key, String(value))
    } else {
      form.append(key, String(value))
    }
  }
  return form
}

export const categoryService = {
  /** Public list; staff see inactive categories too. */
  list: (params?: { is_active?: boolean; search?: string; has_products?: boolean }) =>
    get<Paginated<Category>>('/categories/', params),

  get: (id: string) => get<Category>(`/categories/${id}/`),

  create: (payload: CategoryInput) => post<Category>('/categories/', payload),

  update: (id: string, payload: Partial<CategoryInput>) =>
    patch<Category>(`/categories/${id}/`, payload),

  /** Soft delete: the row survives so historic orders keep their references. */
  remove: (id: string) => del<void>(`/categories/${id}/`),
}

export const productService = {
  list: (query?: ProductQuery) => get<Paginated<Product>>('/products/', query),

  get: (id: string) => get<Product>(`/products/${id}/`),

  create: (payload: ProductInput) => post<Product>('/products/', payload),

  /** Upload accepts either an `image_url` or a multipart `image` file. */
  createWithUpload(payload: ProductInput & { image?: File | null }) {
    if (!payload.image) {
      const { image: _image, ...rest } = payload
      return post<Product>('/products/', rest)
    }
    return postForm<Product>('/products/', toFormData(payload))
  },

  update: (id: string, payload: Partial<ProductInput>) =>
    patch<Product>(`/products/${id}/`, payload),

  /**
   * PATCH with a file. The image is only accepted on create and on the images
   * sub-route, so the multipart body is merged into the same PATCH and Django
   * picks it up from the serializer's write-only `image` field.
   */
  updateWithUpload(id: string, payload: Partial<ProductInput> & { image?: File | null }) {
    if (!payload.image) {
      const { image: _image, ...rest } = payload
      return patch<Product>(`/products/${id}/`, rest)
    }
    return patchForm<Product>(`/products/${id}/`, toFormData(payload))
  },

  /** Set, increment or decrement stock atomically. */
  updateStock: (id: string, payload: ProductStockUpdate) =>
    patch<Product>(`/products/${id}/stock/`, payload),

  /** Soft delete: flags the product inactive. */
  remove: (id: string) => del<void>(`/products/${id}/`),

  images: {
    list: (productId: string) => get<Paginated<ProductImage>>(`/products/${productId}/images/`),
    add: (productId: string, payload: ProductImageInput) =>
      post<ProductImage>(`/products/${productId}/images/`, payload),
    update: (productId: string, imageId: string, payload: Partial<ProductImageInput>) =>
      patch<ProductImage>(`/products/${productId}/images/${imageId}/`, payload),
    remove: (productId: string, imageId: string) =>
      del<void>(`/products/${productId}/images/${imageId}/`),
  },
}

export const adminProductService = {
  /** Staff list: includes inactive rows and supports `ordering=-units_sold`. */
  list: (params?: {
    is_active?: boolean
    category?: string
    search?: string
    ordering?: string
    page?: number
    page_size?: number
  }) => get<Paginated<Product>>('/admin/products/', params),

  summary: () => get<ProductSummaryTotals>('/admin/products/summary/'),
}

export type CategoryService = typeof categoryService
export type ProductService = typeof productService
export type AdminProductService = typeof adminProductService
