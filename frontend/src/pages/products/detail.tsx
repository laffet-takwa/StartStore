import { useNavigate, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { productsApi, categoriesApi, suppliersApi } from '@/api'
import { ArrowLeft, Image } from 'lucide-react'
import { toast } from 'sonner'

const productSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  sku: z.string().min(1, 'SKU is required'),
  category: z.string().optional().or(z.literal('')),
  supplier: z.string().optional().or(z.literal('')),
  brand: z.string().optional().or(z.literal('')),
  description: z.string().optional().or(z.literal('')),
  purchase_price: z.coerce.number().min(0, 'Purchase price is required'),
  selling_price: z.coerce.number().min(0, 'Selling price is required'),
  stock_quantity: z.coerce.number().min(0, 'Stock quantity is required'),
  minimum_stock: z.coerce.number().min(0, 'Minimum stock is required'),
  barcode: z.string().optional().or(z.literal('')),
  is_active: z.boolean().default(true),
})

type ProductForm = z.infer<typeof productSchema>

export default function ProductEditPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const isEdit = Boolean(id)

  const { data: categoriesData } = useQuery({
    queryKey: ['categories-list'],
    queryFn: () => categoriesApi.list({ page_size: 100 }),
  })

  const { data: suppliersData } = useQuery({
    queryKey: ['suppliers-list'],
    queryFn: () => suppliersApi.list({ page_size: 100 }),
  })

  const { data: product, isLoading } = useQuery({
    queryKey: ['product', id],
    queryFn: () => productsApi.get(id!),
    enabled: isEdit && Boolean(id),
  })

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ProductForm>({
    resolver: zodResolver(productSchema) as any,
    values: product ? {
      name: product.name,
      sku: product.sku,
      category: product.category?.id || '',
      supplier: product.supplier?.id || '',
      brand: product.brand || '',
      description: product.description || '',
      purchase_price: product.purchase_price,
      selling_price: product.selling_price,
      stock_quantity: product.stock_quantity,
      minimum_stock: product.minimum_stock,
      barcode: product.barcode || '',
      is_active: product.is_active,
    } : undefined,
  })

  const mutation = useMutation({
    mutationFn: (data: ProductForm) =>
      isEdit ? productsApi.update(id!, data as unknown as Parameters<typeof productsApi.update>[1]) : productsApi.create(data as unknown as Parameters<typeof productsApi.create>[0]),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      toast.success(isEdit ? 'Product updated' : 'Product created')
      navigate('/products')
    },
    onError: () => toast.error('Failed to save product'),
  })

  const onSubmit = (data: ProductForm) => {
    mutation.mutate(data)
  }

  if (isEdit && isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-3xl">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-100 rounded-md">
          <ArrowLeft className="h-5 w-5 text-slate-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{isEdit ? 'Edit Product' : 'New Product'}</h1>
          <p className="text-sm text-muted">{isEdit ? 'Update product information' : 'Add a new product'}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="bg-surface rounded-lg border border-slate-200 p-6 space-y-5">
        {isEdit && product && (product.image || product.images?.length) && (
          <div className="bg-slate-50 rounded-lg p-4">
            <label className="block text-sm font-medium text-slate-700 mb-2">Current Image</label>
            <div className="flex items-center gap-4">
              <div className="relative h-20 w-20 rounded-lg overflow-hidden border border-slate-200 bg-white">
                {product.image ? (
                  <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                ) : product.images && product.images.length > 0 ? (
                  <img src={product.images[0].image} alt={product.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-400">
                    <Image className="h-8 w-8" />
                  </div>
                )}
              </div>
              <div>
                <p className="text-sm font-medium text-slate-900">{product.name}</p>
                <p className="text-xs text-muted">SKU: {product.sku}</p>
              </div>
            </div>
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Name *</label>
            <input {...register('name')} className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20" />
            {errors.name && <p className="mt-1 text-sm text-danger">{errors.name.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">SKU *</label>
            <input {...register('sku')} className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20" />
            {errors.sku && <p className="mt-1 text-sm text-danger">{errors.sku.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
            <select {...register('category')} className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20">
              <option value="">Select category</option>
              {categoriesData?.results?.map((c: any) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Supplier</label>
            <select {...register('supplier')} className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20">
              <option value="">Select supplier</option>
              {suppliersData?.results?.map((s: any) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Brand</label>
            <input {...register('brand')} className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Barcode</label>
            <input {...register('barcode')} className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Purchase Price *</label>
            <input type="number" step="0.01" {...register('purchase_price')} className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20" />
            {errors.purchase_price && <p className="mt-1 text-sm text-danger">{errors.purchase_price.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Selling Price *</label>
            <input type="number" step="0.01" {...register('selling_price')} className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20" />
            {errors.selling_price && <p className="mt-1 text-sm text-danger">{errors.selling_price.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Stock Quantity *</label>
            <input type="number" {...register('stock_quantity')} className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20" />
            {errors.stock_quantity && <p className="mt-1 text-sm text-danger">{errors.stock_quantity.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Minimum Stock *</label>
            <input type="number" {...register('minimum_stock')} className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20" />
            {errors.minimum_stock && <p className="mt-1 text-sm text-danger">{errors.minimum_stock.message}</p>}
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
          <textarea {...register('description')} rows={3} className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
          <select {...register('is_active')} className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20">
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
        </div>
        <div className="flex gap-3 justify-end">
          <button type="button" onClick={() => navigate(-1)} className="px-4 py-2 text-sm border border-slate-200 rounded-md hover:bg-slate-50">Cancel</button>
          <button type="submit" disabled={isSubmitting || mutation.isPending} className="px-4 py-2 text-sm bg-primary text-white rounded-md hover:bg-primary/90 disabled:opacity-50">
            {mutation.isPending ? 'Saving...' : isEdit ? 'Update' : 'Create'}
          </button>
        </div>
      </form>
    </div>
  )
}
