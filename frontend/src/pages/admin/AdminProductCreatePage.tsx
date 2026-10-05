import { useNavigate } from 'react-router-dom'

import { Alert, PageLoader } from '@/components/common/Feedback'
import { ProductForm } from '@/components/admin/ProductForm'
import { AdminPageHeader } from '@/components/admin/DataTable'
import { Breadcrumbs } from '@/components/layout/Primitives'
import { useMutation } from '@tanstack/react-query'
import { useQueryClient } from '@tanstack/react-query'
import { useAllCategories } from '@/hooks/useProducts'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { messageOf } from '@/hooks/useCart'
import { productService } from '@/services/product.service'
import { toast } from '@/store/uiStore'
import type { ProductFormValues } from '@/utils/validation'
import type { ProductInput } from '@/types'
import { ROUTES } from '@/utils/constants'

export default function AdminProductCreatePage() {
  useDocumentTitle('New product — StartStore admin')

  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { data: categories, isLoading } = useAllCategories()

  const createProduct = useMutation({
    mutationFn: (payload: ProductInput & { image?: File | null }) =>
      productService.createWithUpload(payload),
    onSuccess: (product) => {
      void queryClient.invalidateQueries({ queryKey: ['admin'] })
      void queryClient.invalidateQueries({ queryKey: ['products'] })
      toast.success('Product created', product.name)
      navigate(ROUTES.admin.productEdit(product.id), { replace: true })
    },
  })

  const onSubmit = async (values: ProductFormValues & { image?: File | null }) => {
    // The schema normalises empty optional text to `null`, which is exactly what
    // the nullable API columns accept.
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
      await createProduct.mutateAsync(payload)
    } catch (error) {
      // The form keeps the user's input; a toast explains the failure.
      toast.error('Could not create product', messageOf(error))
    }
  }

  if (isLoading) return <PageLoader label="Loading categories" />

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: 'Admin', to: ROUTES.admin.dashboard },
          { label: 'Products', to: ROUTES.admin.products },
          { label: 'New product' },
        ]}
      />

      <AdminPageHeader
        title="New product"
        description="Products appear in the storefront as soon as they are saved and visible."
      />

      {categories && categories.results.length === 0 && (
        <Alert variant="warning" title="No categories yet">
          This product can be created without a category — add one from the Categories
          page later if you want to group it.
        </Alert>
      )}

      <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-card sm:p-8">
        <ProductForm
          categories={categories?.results ?? []}
          onSubmit={onSubmit}
          isSubmitting={createProduct.isPending}
          submitLabel="Create product"
        />
      </div>
    </div>
  )
}
