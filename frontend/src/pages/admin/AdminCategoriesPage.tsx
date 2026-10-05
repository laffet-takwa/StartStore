import { useState } from 'react'
import { Archive, Pencil, Plus, Search } from 'lucide-react'

import { Badge, Button } from '@/components/common'
import { ErrorState, NoResultsState, TableSkeleton } from '@/components/common/Feedback'
import { ConfirmDialog, Modal } from '@/components/common/Overlay'
import {
  AdminPageHeader,
  TablePagination,
  TableWrapper,
  Td,
  Th,
  Tr,
} from '@/components/admin/DataTable'
import { useAdminCategories, useCreateCategory, useDeleteCategory, useUpdateCategory } from '@/hooks/useAdmin'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { messageOf } from '@/hooks/useCart'
import type { Category } from '@/types'
import { ADMIN_PAGE_SIZE } from '@/utils/constants'
import { categoryFormSchema, type CategoryFormValues } from '@/utils/validation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Input, Textarea, Checkbox } from '@/components/common'

export default function AdminCategoriesPage() {
  useDocumentTitle('Categories — StartStore admin')

  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [editing, setEditing] = useState<Category | null>(null)
  const [creating, setCreating] = useState(false)
  const [confirmId, setConfirmId] = useState<string | null>(null)

  const debounced = useDebouncedValue(search, 350)
  const { data, isLoading, isError, error, refetch } = useAdminCategories()
  const archive = useDeleteCategory()

  const all = data?.results ?? []
  const filtered = all.filter((category) =>
    debounced
      ? `${category.name} ${category.description ?? ''}`
          .toLowerCase()
          .includes(debounced.toLowerCase())
      : true,
  )

  const totalPages = Math.max(1, Math.ceil(filtered.length / ADMIN_PAGE_SIZE))
  const rows = filtered.slice((page - 1) * ADMIN_PAGE_SIZE, page * ADMIN_PAGE_SIZE)

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Categories"
        description="Categories group the catalogue for shoppers. Archiving one hides it from the storefront without touching its products."
        action={
          <Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => setCreating(true)}>
            New category
          </Button>
        }
      />

      <div className="max-w-sm">
        <Input
          leadingIcon={<Search className="h-4 w-4" aria-hidden />}
          placeholder="Search categories"
          aria-label="Search categories"
          value={search}
          onChange={(event) => {
            setSearch(event.target.value)
            setPage(1)
          }}
          className="h-10"
        />
      </div>

      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-card">
        {isLoading ? (
          <TableSkeleton rows={5} columns={5} />
        ) : isError ? (
          <ErrorState
            className="m-5"
            message={error instanceof Error ? error.message : 'Please try again.'}
            onRetry={() => void refetch()}
          />
        ) : rows.length === 0 ? (
          <NoResultsState query={debounced} onClear={() => setSearch('')} />
        ) : (
          <TableWrapper>
            <thead>
              <tr>
                <Th>Category</Th>
                <Th>Slug</Th>
                <Th align="right">Products</Th>
                <Th align="right">Status</Th>
                <Th align="right">Actions</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((category) => (
                <Tr key={category.id}>
                  <Td>
                    <p className="text-sm font-medium text-ink">{category.name}</p>
                    {category.description && (
                      <p className="mt-0.5 line-clamp-1 max-w-md text-xs text-ink-muted">
                        {category.description}
                      </p>
                    )}
                  </Td>
                  <Td className="font-mono text-xs">{category.slug}</Td>
                  <Td align="right" className="text-ink">
                    {category.product_count ?? 0}
                  </Td>
                  <Td align="right">
                    {category.is_active ? (
                      <Badge variant="success">Visible</Badge>
                    ) : (
                      <Badge variant="neutral">Archived</Badge>
                    )}
                  </Td>
                  <Td align="right">
                    <div className="flex justify-end gap-1">
                      <button
                        type="button"
                        aria-label={`Edit ${category.name}`}
                        onClick={() => setEditing(category)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-muted transition-colors hover:bg-zinc-100 hover:text-ink"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      {category.is_active && (
                        <button
                          type="button"
                          aria-label={`Archive ${category.name}`}
                          onClick={() => setConfirmId(category.id)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-faint transition-colors hover:bg-rose-50 hover:text-rose-600"
                        >
                          <Archive className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </Td>
                </Tr>
              ))}
            </tbody>
          </TableWrapper>
        )}

        {rows.length > 0 && (
          <TablePagination
            page={page}
            totalPages={totalPages}
            count={filtered.length}
            pageSize={ADMIN_PAGE_SIZE}
            onChange={setPage}
          />
        )}
      </div>

      <CategoryModal
        open={creating || Boolean(editing)}
        category={editing}
        onClose={() => {
          setCreating(false)
          setEditing(null)
        }}
        onArchived={(id) => archive.mutate(id)}
      />

      <ConfirmDialog
        open={Boolean(confirmId)}
        title="Archive this category?"
        description="It will disappear from the storefront. Products in it stay exactly as they are."
        confirmLabel="Archive category"
        variant="danger"
        isLoading={archive.isPending}
        onCancel={() => setConfirmId(null)}
        onConfirm={() => {
          if (confirmId) archive.mutate(confirmId)
          setConfirmId(null)
        }}
      />
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* Modal form                                                                   */
/* -------------------------------------------------------------------------- */

function CategoryModal({
  open,
  category,
  onClose,
}: {
  open: boolean
  category: Category | null
  onClose: () => void
  onArchived?: (id: string) => void
}) {
  const createCategory = useCreateCategory()
  const updateCategory = useUpdateCategory()
  const isSubmitting = createCategory.isPending || updateCategory.isPending

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CategoryFormValues>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: { name: '', description: '', image_url: '', is_active: true },
  })

  const isActive = watch('is_active')

  // Re-seed the form each time the modal opens for a different category.
  const [seededId, setSeededId] = useState<string | null>(null)
  if (open && seededId !== (category?.id ?? 'new')) {
    setSeededId(category?.id ?? 'new')
    reset({
      name: category?.name ?? '',
      description: category?.description ?? '',
      image_url: category?.image_url ?? '',
      is_active: category?.is_active ?? true,
    })
  }

  const onSubmit = async (values: CategoryFormValues) => {
    try {
      const payload = {
        name: values.name,
        description: values.description || null,
        image_url: values.image_url || null,
        is_active: values.is_active,
      }
      if (category) await updateCategory.mutateAsync({ id: category.id, ...payload })
      else await createCategory.mutateAsync(payload)
      onClose()
    } catch (error) {
      // Mutation callbacks surface the message; keep the dialog open.
      if (!error) return
      throw messageOf(error)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={category ? 'Edit category' : 'New category'}
      description={
        category
          ? 'Rename it or change its visibility.'
          : 'Categories are visible in the storefront as soon as they are saved.'
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <Input
          label="Name"
          placeholder="Home & Kitchen"
          error={errors.name?.message}
          {...register('name')}
        />

        <Textarea
          label="Description"
          placeholder="Everyday essentials for the kitchen and home."
          rows={4}
          error={errors.description?.message}
          {...register('description')}
        />

        <Input
          label="Image URL"
          placeholder="https://…/category.jpg"
          hint="Optional. A gradient tile is used when empty."
          error={errors.image_url?.message}
          {...register('image_url')}
        />

        <Checkbox
          label="Visible in the storefront"
          checked={isActive}
          onChange={(event) => setValue('is_active', event.target.checked)}
        />

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            {category ? 'Save changes' : 'Create category'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
