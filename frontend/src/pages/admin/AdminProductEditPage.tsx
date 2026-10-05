import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'

import { Badge, Button, ButtonLink } from '@/components/common'
import { Alert, ErrorState, PageLoader } from '@/components/common/Feedback'
import { Breadcrumbs } from '@/components/layout/Primitives'
import { ProductForm } from '@/components/admin/ProductForm'
import { AdminPageHeader } from '@/components/admin/DataTable'
import { useAllCategories, useProduct } from '@/hooks/useProducts'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { messageOf } from '@/hooks/useCart'
import { productService } from '@/services/product.service'
import { toast } from '@/store/uiStore'
import { ROUTES } from '@/utils/constants'
import type { ProductFormValues } from '@/utils/validation'
import type { ProductInput } from '@/types'

export default function AdminProductEditPage() {
  const { productId } = useParams<{ productId: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data: product, isLoading, isError, error, refetch } = useProduct(productId)
  const { data: categories } = useAllCategories()
  const [formError, setFormError] = useState<string | null>(null)

  useDocumentTitle(product ? `Edit ${product.name} — admin` : 'Edit product')

  const updateProduct = useMutation({
    mutationFn: (payload: ProductInput & { image?: File | null }) => {
      if (!productId) throw new Error('Missing product id')
      // An uploaded file makes this a multipart PATCH, not a new product.
      return productService.updateWithUpload(productId, payload)
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['products'] })
      void queryClient.invalidateQueries({ queryKey: ['admin'] })
      setFormError(null)
      toast.success('Product saved', product?.name)
    },
  })

  const adjustStock = useMutation({
    mutationFn: (stock: number) => {
      if (!productId) throw new Error('Missing product id')
      return productService.updateStock(productId, { stock, mode: 'set' })
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['products'] })
      void queryClient.invalidateQueries({ queryKey: ['admin'] })
      toast.success('Stock updated')
    },
  })

  const onSubmit = async (values: ProductFormValues & { image?: File | null }) => {
    setFormError(null)
    const payload: ProductInput & { image?: File | null } = {
      name: values.name,
      price: values.price,
      stock: values.stock,
      is_active: values.is_active,
      category_id: values.category_id,
      sku: values.sku,
      discount_price: values.discount_price,
      description: values.description,
      image_url: values.image_url,
      image: values.image ?? null,
    }
    try {
      await updateProduct.mutateAsync(payload)
    } catch (submitError) {
      setFormError(messageOf(submitError, 'Could not save this product.'))
    }
  }

  if (isLoading) return <PageLoader label="Loading product" />

  if (isError || !product) {
    return (
      <ErrorState
        title="Product not found"
        message={error instanceof Error ? error.message : 'Please try again.'}
        onRetry={() => void refetch()}
      />
    )
  }

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: 'Admin', to: ROUTES.admin.dashboard },
          { label: 'Products', to: ROUTES.admin.products },
          { label: product.name },
        ]}
      />

      <AdminPageHeader
        title={product.name}
        description={`SKU ${product.sku || '—'} · ${
          product.category?.name ?? 'Uncategorised'
        }`}
        action={
          <div className="flex flex-wrap items-center gap-2">
            {!product.is_active && <Badge variant="warning">Archived</Badge>}
            <ButtonLink to={ROUTES.admin.products} variant="outline" size="sm">
              Back to list
            </ButtonLink>
          </div>
        }
      />

      {formError && (
        <Alert variant="danger" title="Could not save">
          {formError}
        </Alert>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_260px]">
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-card sm:p-8">
          <ProductForm
            product={product}
            categories={categories?.results ?? []}
            onSubmit={onSubmit}
            isSubmitting={updateProduct.isPending}
            submitLabel="Save changes"
          />
        </div>

        <aside className="space-y-4">
          {/* Quick stock adjustment */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-card">
            <h2 className="text-sm font-semibold text-ink">Quick stock</h2>
            <p className="mt-1.5 text-xs leading-relaxed text-ink-muted">
              Set the on-hand quantity without leaving this page.
            </p>
            <div className="mt-4 flex gap-2">
              {[0, 5, 25, 100].map((value) => (
                <button
                  key={value}
                  type="button"
                  disabled={adjustStock.isPending || product.stock === value}
                  onClick={() => adjustStock.mutate(value)}
                  className="h-9 flex-1 rounded-lg border border-zinc-300 text-xs font-medium text-ink-soft transition-colors hover:border-zinc-400 hover:bg-zinc-50 disabled:opacity-50"
                >
                  {value}
                </button>
              ))}
            </div>
            <p className="mt-3 text-xs text-ink-muted">
              Currently <span className="font-semibold text-ink">{product.stock}</span> in
              stock.
            </p>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-surface p-5">
            <h2 className="text-sm font-semibold text-ink">Gallery</h2>
            <p className="mt-1.5 text-xs leading-relaxed text-ink-muted">
              {product.images.length} additional image
              {product.images.length === 1 ? '' : 's'} attached to this product.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={() => navigate(ROUTES.admin.productEdit(product.id))}
            >
              Manage gallery
            </Button>
          </div>
        </aside>
      </div>
    </div>
  )
}
