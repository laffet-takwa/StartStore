import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { productsApi } from '@/api'
import { Plus, Search, Edit2, Trash2, Eye } from 'lucide-react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { Card, CardBody, Badge, Button, EmptyState } from '@/components/ui'
import type { Product } from '@/types'

export default function ProductsPage() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['products', page, search],
    queryFn: () => productsApi.list({ page, search, page_size: 20 }),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => productsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      toast.success('Product deleted')
      setDeleteId(null)
    },
    onError: () => toast.error('Failed to delete product'),
  })

  return (
    <div className="space-y-4 page-enter">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Products</h1>
          <p className="text-sm text-muted">Manage your products</p>
        </div>
        <Link to="/products/new">
          <Button icon={<Plus className="h-4 w-4" />}>Add Product</Button>
        </Link>
      </div>

      <Card>
        <CardBody className="p-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted" />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              placeholder="Search products..."
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
                      <th className="text-left px-4 py-3 font-medium text-slate-600">Product</th>
                      <th className="text-left px-4 py-3 font-medium text-slate-600">SKU</th>
                      <th className="text-left px-4 py-3 font-medium text-slate-600">Category</th>
                      <th className="text-left px-4 py-3 font-medium text-slate-600">Price</th>
                      <th className="text-left px-4 py-3 font-medium text-slate-600">Stock</th>
                      <th className="text-left px-4 py-3 font-medium text-slate-600">Status</th>
                      <th className="text-right px-4 py-3 font-medium text-slate-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {data?.results?.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-4 py-8">
                          <EmptyState title="No products found" description="Try adjusting your search or create a new product." />
                        </td>
                      </tr>
                    ) : (
                      data?.results?.map((product: Product) => (
                        <tr key={product.id} className="hover:bg-slate-50">
                          <td className="px-4 py-3">
                            <Link to={`/products/${product.id}`} className="font-medium text-slate-900 hover:text-primary">
                              {product.name}
                            </Link>
                          </td>
                          <td className="px-4 py-3 text-slate-600">{product.sku}</td>
                          <td className="px-4 py-3 text-slate-600">{product.category_name || '-'}</td>
                          <td className="px-4 py-3 text-slate-600">{product.selling_price.toLocaleString()} TND</td>
                          <td className="px-4 py-3">
                            <Badge variant={product.stock_quantity <= product.minimum_stock ? 'danger' : 'success'}>
                              {product.stock_quantity}
                            </Badge>
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant={product.is_active ? 'success' : 'default'}>
                              {product.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-end gap-1">
                              <Link to={`/products/${product.id}`} className="p-2 hover:bg-slate-100 rounded-lg"><Eye className="h-4 w-4 text-slate-600" /></Link>
                              <Link to={`/products/${product.id}/edit`} className="p-2 hover:bg-slate-100 rounded-lg"><Edit2 className="h-4 w-4 text-slate-600" /></Link>
                              <button onClick={() => setDeleteId(product.id)} className="p-2 hover:bg-danger/10 rounded-lg"><Trash2 className="h-4 w-4 text-danger" /></button>
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
                  <EmptyState title="No products found" description="Try adjusting your search or create a new product." />
                </CardBody>
              </Card>
            ) : (
              data?.results?.map((product: Product) => (
                <Card key={product.id} hover className="animate-slide-up">
                  <CardBody className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <Link to={`/products/${product.id}`} className="text-sm font-semibold text-slate-900 hover:text-primary truncate block">
                          {product.name}
                        </Link>
                        <p className="text-xs text-muted mt-0.5">SKU: {product.sku}</p>
                        <p className="text-xs text-muted">{product.category_name || 'Uncategorized'}</p>
                      </div>
                      <Badge variant={product.stock_quantity <= product.minimum_stock ? 'danger' : 'success'}>
                        {product.stock_quantity} in stock
                      </Badge>
                    </div>

                    <div className="mt-3 flex items-center justify-between text-xs text-slate-600">
                      <span>{product.selling_price.toLocaleString()} TND</span>
                      <span>{product.is_active ? 'Active' : 'Inactive'}</span>
                    </div>

                    <div className="mt-3 flex items-center justify-end gap-1">
                      <Link to={`/products/${product.id}`} className="p-2 hover:bg-slate-100 rounded-lg"><Eye className="h-4 w-4 text-slate-600" /></Link>
                      <Link to={`/products/${product.id}/edit`} className="p-2 hover:bg-slate-100 rounded-lg"><Edit2 className="h-4 w-4 text-slate-600" /></Link>
                      <button onClick={() => setDeleteId(product.id)} className="p-2 hover:bg-danger/10 rounded-lg"><Trash2 className="h-4 w-4 text-danger" /></button>
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

      {deleteId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-surface rounded-lg p-6 max-w-sm w-full mx-4">
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Delete Product</h3>
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
