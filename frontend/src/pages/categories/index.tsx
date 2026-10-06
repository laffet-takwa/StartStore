import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { categoriesApi } from '@/api'
import { Plus, Search, Edit2, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Card, CardBody, Badge, Button, EmptyState } from '@/components/ui'
import type { Category } from '@/types'

export default function CategoriesPage() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [editing, setEditing] = useState<Category | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['categories', page, search],
    queryFn: () => categoriesApi.list({ page, search, page_size: 20 }),
  })

  const createMutation = useMutation({
    mutationFn: (data: Partial<Category>) => categoriesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      toast.success('Category created')
      setFormOpen(false)
      setName('')
      setDescription('')
    },
    onError: () => toast.error('Failed to create category'),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Category> }) => categoriesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      toast.success('Category updated')
      setEditing(null)
      setName('')
      setDescription('')
    },
    onError: () => toast.error('Failed to update category'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => categoriesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      toast.success('Category deleted')
      setDeleteId(null)
    },
    onError: () => toast.error('Failed to delete category'),
  })

  const openEdit = (cat: Category) => {
    setEditing(cat)
    setName(cat.name)
    setDescription(cat.description || '')
    setFormOpen(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (editing) {
      updateMutation.mutate({ id: editing.id, data: { name, description } })
    } else {
      createMutation.mutate({ name, description })
    }
  }

  return (
    <div className="space-y-4 page-enter">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Categories</h1>
          <p className="text-sm text-muted">Manage product categories</p>
        </div>
        <Button icon={<Plus className="h-4 w-4" />} onClick={() => { setEditing(null); setName(''); setDescription(''); setFormOpen(true) }}>
          Add Category
        </Button>
      </div>

      <Card>
        <CardBody className="p-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted" />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              placeholder="Search categories..."
              className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </CardBody>
      </Card>

      {isLoading ? (
        <Card>
          <CardBody>
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-12 rounded-md bg-slate-100 animate-pulse" />
              ))}
            </div>
          </CardBody>
        </Card>
      ) : (
        <>
          <div className="hidden md:block">
            <Card>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50">
                      <th className="text-left px-4 py-3 font-medium text-slate-600">Category</th>
                      <th className="text-left px-4 py-3 font-medium text-slate-600">Products</th>
                      <th className="text-left px-4 py-3 font-medium text-slate-600">Status</th>
                      <th className="text-right px-4 py-3 font-medium text-slate-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {data?.results?.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-4 py-8">
                          <EmptyState title="No categories found" description="Try adjusting your search or create a new category." />
                        </td>
                      </tr>
                    ) : (
                      data?.results?.map((cat: Category) => (
                        <tr key={cat.id} className="hover:bg-slate-50">
                          <td className="px-4 py-3 font-medium text-slate-900">{cat.name}</td>
                          <td className="px-4 py-3 text-slate-600">{cat.product_count}</td>
                          <td className="px-4 py-3">
                            <Badge variant={cat.is_active ? 'success' : 'default'}>
                              {cat.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-end gap-1">
                              <button onClick={() => openEdit(cat)} className="p-2 hover:bg-slate-100 rounded-lg"><Edit2 className="h-4 w-4 text-slate-600" /></button>
                              <button onClick={() => setDeleteId(cat.id)} className="p-2 hover:bg-danger/10 rounded-lg"><Trash2 className="h-4 w-4 text-danger" /></button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>

          <div className="md:hidden space-y-3">
            {data?.results?.length === 0 ? (
              <Card>
                <CardBody>
                  <EmptyState title="No categories found" description="Try adjusting your search or create a new category." />
                </CardBody>
              </Card>
            ) : (
              data?.results?.map((cat: Category) => (
                <Card key={cat.id} hover className="animate-slide-up">
                  <CardBody className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-900">{cat.name}</p>
                        <p className="text-xs text-muted mt-0.5">{cat.product_count} products</p>
                      </div>
                      <Badge variant={cat.is_active ? 'success' : 'default'}>
                        {cat.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    <div className="mt-3 flex items-center justify-end gap-1">
                      <button onClick={() => openEdit(cat)} className="p-2 hover:bg-slate-100 rounded-lg"><Edit2 className="h-4 w-4 text-slate-600" /></button>
                      <button onClick={() => setDeleteId(cat.id)} className="p-2 hover:bg-danger/10 rounded-lg"><Trash2 className="h-4 w-4 text-danger" /></button>
                    </div>
                  </CardBody>
                </Card>
              ))
            )}
          </div>

          {data && data.count > 20 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted">Showing {(page - 1) * 20 + 1} to {Math.min(page * 20, data.count)} of {data.count}</p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={!data.previous} onClick={() => setPage((p) => p - 1)}>Previous</Button>
                <Button variant="outline" size="sm" disabled={!data.next} onClick={() => setPage((p) => p + 1)}>Next</Button>
              </div>
            </div>
          )}
        </>
      )}

      {formOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <form onSubmit={handleSubmit} className="bg-surface rounded-lg p-6 max-w-md w-full mx-4 space-y-4">
            <h3 className="text-lg font-semibold text-slate-900">{editing ? 'Edit Category' : 'New Category'}</h3>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Name *</label>
              <input value={name} onChange={(e) => setName(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20" />
            </div>
            <div className="flex gap-3 justify-end">
              <Button type="button" variant="outline" onClick={() => { setFormOpen(false); setEditing(null); }}>Cancel</Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                {editing ? 'Update' : 'Create'}
              </Button>
            </div>
          </form>
        </div>
      )}

      {deleteId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-surface rounded-lg p-6 max-w-sm w-full mx-4">
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Delete Category</h3>
            <p className="text-sm text-muted mb-4">Are you sure? This action cannot be undone.</p>
            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
              <Button variant="danger" onClick={() => deleteMutation.mutate(deleteId)} disabled={deleteMutation.isPending}>
                {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
