import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Upload, X } from 'lucide-react'

import { Button, Checkbox, Input, Select, Textarea } from '@/components/common'
import { Alert } from '@/components/common/Feedback'
import { cn } from '@/lib/cn'
import type { Category, Product } from '@/types'
import { productFormSchema, type ProductFormValues } from '@/utils/validation'

export interface ProductFormProps {
  /** Present when editing. */
  product?: Product | null
  categories: Category[]
  onSubmit: (values: ProductFormValues & { image?: File | null }) => Promise<void> | void
  isSubmitting?: boolean
  submitLabel?: string
  className?: string
}

/**
 * Create/edit form.
 *
 * Prices are validated as decimal strings rather than numbers, and the discount
 * must be strictly cheaper than the list price - the same rule the API enforces,
 * mirrored client-side so the mistake is caught before a round-trip.
 */
export function ProductForm({
  product,
  categories,
  onSubmit,
  isSubmitting,
  submitLabel,
  className,
}: ProductFormProps) {
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(
    product?.image_url ?? null,
  )
  const fileInputRef = useRef<HTMLInputElement>(null)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isDirty },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    mode: 'onBlur',
    defaultValues: {
      name: product?.name ?? '',
      category_id: product?.category?.id ?? '',
      sku: product?.sku ?? '',
      price: product?.price ?? '',
      discount_price: product?.discount_price ?? '',
      stock: product?.stock ?? 0,
      description: product?.description ?? '',
      image_url: product?.image_url ?? '',
      is_active: product?.is_active ?? true,
    },
  })

  // Refetching a different product must repopulate the form.
  useEffect(() => {
    reset({
      name: product?.name ?? '',
      category_id: product?.category?.id ?? '',
      sku: product?.sku ?? '',
      price: product?.price ?? '',
      discount_price: product?.discount_price ?? '',
      stock: product?.stock ?? 0,
      description: product?.description ?? '',
      image_url: product?.image_url ?? '',
      is_active: product?.is_active ?? true,
    })
    setImageFile(null)
    setImagePreview(product?.image_url ?? null)
  }, [product, reset])

  const price = watch('price')
  const discountPrice = watch('discount_price')
  const showDiscountWarning =
    Boolean(discountPrice) && Number(discountPrice) >= Number(price) && Number(price) > 0

  const onPickFile = (file: File | undefined) => {
    if (!file) return
    setImageFile(file)
    setImagePreview((previous) => {
      if (previous?.startsWith('blob:')) URL.revokeObjectURL(previous)
      return URL.createObjectURL(file)
    })
  }

  return (
    <form
      onSubmit={handleSubmit((values) => onSubmit({ ...values, image: imageFile }))}
      className={cn('space-y-6', className)}
      noValidate
    >
      <div className="grid gap-6 lg:grid-cols-2">
        {/* --- Left: identity --- */}
        <div className="space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-[0.08em] text-ink-muted">
            Product details
          </h2>

          <Input
            label="Name"
            placeholder="Aurora Mechanical Keyboard"
            error={errors.name?.message}
            {...register('name')}
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <Select
              label="Category"
              placeholder="Uncategorised"
              options={categories.map((category) => ({
                value: category.id,
                label: category.name,
              }))}
              error={errors.category_id?.message}
              {...register('category_id')}
            />
            <Input
              label="SKU"
              placeholder="AURORA-KB-87"
              hint="Optional. Stored uppercase."
              error={errors.sku?.message}
              {...register('sku')}
            />
          </div>

          <Textarea
            label="Description"
            placeholder="Hot-swappable 87-key keyboard with a gasket mount."
            rows={6}
            error={errors.description?.message}
            {...register('description')}
          />
        </div>

        {/* --- Right: commerce + media --- */}
        <div className="space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-[0.08em] text-ink-muted">
            Pricing & inventory
          </h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Price"
              inputMode="decimal"
              placeholder="129.00"
              leadingIcon={<span className="text-sm">$</span>}
              error={errors.price?.message}
              {...register('price')}
            />
            <Input
              label="Discount price"
              inputMode="decimal"
              placeholder="99.00"
              leadingIcon={<span className="text-sm">$</span>}
              hint="Leave empty for no discount."
              error={errors.discount_price?.message}
              {...register('discount_price')}
            />
          </div>

          {showDiscountWarning && (
            <Alert variant="warning">
              The discount price must be lower than the list price.
            </Alert>
          )}

          <Input
            label="Stock"
            type="number"
            inputMode="numeric"
            min={0}
            error={errors.stock?.message}
            {...register('stock')}
          />

          <div className="space-y-2 pt-1">
            <p className="text-sm font-medium text-ink">Product image</p>
            <div className="flex items-start gap-4">
              <div className="h-24 w-24 shrink-0 overflow-hidden rounded-xl border border-zinc-200 bg-surface">
                {imagePreview ? (
                  <img src={imagePreview} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-2xs text-ink-faint">
                    No image
                  </div>
                )}
              </div>
              <div className="flex-1 space-y-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(event) => onPickFile(event.target.files?.[0])}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  leftIcon={<Upload className="h-4 w-4" />}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {imageFile ? 'Replace file' : 'Upload file'}
                </Button>
                {imageFile && (
                  <p className="flex items-center gap-1.5 text-2xs text-ink-muted">
                    {imageFile.name}
                    <button
                      type="button"
                      aria-label="Remove selected file"
                      onClick={() => {
                        setImageFile(null)
                        setImagePreview(product?.image_url ?? null)
                        if (fileInputRef.current) fileInputRef.current.value = ''
                      }}
                      className="text-ink-faint transition-colors hover:text-rose-600"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </p>
                )}
                <Input
                  placeholder="https://…/image.jpg"
                  aria-label="Image URL"
                  error={errors.image_url?.message}
                  {...register('image_url')}
                />
                <p className="text-2xs text-ink-faint">
                  An uploaded file takes precedence over the URL.
                </p>
              </div>
            </div>
          </div>

          <Checkbox
            label="Visible in the storefront"
            description="Inactive products stay out of the catalogue but keep their order history."
            checked={watch('is_active')}
            onChange={(event) => setValue('is_active', event.target.checked)}
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 border-t border-zinc-100 pt-5">
        <Button
          type="submit"
          isLoading={isSubmitting}
          loadingText={isSubmitting ? 'Saving…' : undefined}
        >
          {submitLabel ?? (product ? 'Save changes' : 'Create product')}
        </Button>
        {isDirty && (
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              reset()
              setImageFile(null)
              setImagePreview(product?.image_url ?? null)
            }}
          >
            Reset
          </Button>
        )}
      </div>
    </form>
  )
}
