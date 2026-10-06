import { useQuery } from '@tanstack/react-query'
import { productsApi, inventoryApi } from '@/api'
import { Warehouse, AlertTriangle, Package, ArrowUpRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Card, CardBody, Badge, EmptyState } from '@/components/ui'
import type { Product, InventoryMovement } from '@/types'

export default function InventoryPage() {
  const productsQuery = useQuery({
    queryKey: ['products-inventory'],
    queryFn: () => productsApi.list({ page_size: 100 }),
  })

  const movementsQuery = useQuery({
    queryKey: ['inventory-movements'],
    queryFn: () => inventoryApi.movements({ page_size: 20 }),
  })

  const products = productsQuery.data?.results || []
  const lowStock = products.filter((p: Product) => p.stock_quantity <= p.minimum_stock)
  const totalValue = products.reduce((sum: number, p: Product) => sum + (p.stock_value || 0), 0)
  const movements = movementsQuery.data?.results || []

  const isLoading = productsQuery.isLoading || movementsQuery.isLoading

  return (
    <div className="space-y-6 page-enter">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Inventory</h1>
        <p className="text-sm text-muted">Inventory overview and movements</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-surface rounded-lg border border-slate-200 p-5 card-hover">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted">Total Products</p>
              <p className="text-2xl font-bold text-slate-900">{products.length}</p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <Package className="h-5 w-5" />
            </div>
          </div>
        </div>
        <div className="bg-surface rounded-lg border border-slate-200 p-5 card-hover">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted">Low Stock</p>
              <p className="text-2xl font-bold text-slate-900">{lowStock.length}</p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-warning/10 text-warning flex items-center justify-center">
              <AlertTriangle className="h-5 w-5" />
            </div>
          </div>
        </div>
        <div className="bg-surface rounded-lg border border-slate-200 p-5 card-hover">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted">Total Value</p>
              <p className="text-2xl font-bold text-slate-900">{totalValue.toLocaleString()} TND</p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-success/10 text-success flex items-center justify-center">
              <Warehouse className="h-5 w-5" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-900">Recent Movements</h2>
              <Link to="/inventory/movements" className="text-xs text-primary hover:underline flex items-center">
                View all <ArrowUpRight className="h-3 w-3 ml-1" />
              </Link>
            </div>
            <CardBody className="p-0">
              {isLoading ? (
                <div className="p-4 space-y-3">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="h-10 rounded-md bg-slate-100 animate-pulse" />
                  ))}
                </div>
              ) : movements.length === 0 ? (
                <EmptyState title="No movements" description="There are no inventory movements yet." />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50">
                        <th className="text-left px-4 py-3 font-medium text-slate-600">Date</th>
                        <th className="text-left px-4 py-3 font-medium text-slate-600">Product</th>
                        <th className="text-left px-4 py-3 font-medium text-slate-600">Type</th>
                        <th className="text-left px-4 py-3 font-medium text-slate-600">Quantity</th>
                        <th className="text-left px-4 py-3 font-medium text-slate-600">Reference</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {movements.slice(0, 10).map((movement: InventoryMovement) => (
                        <tr key={movement.id} className="hover:bg-slate-50">
                          <td className="px-4 py-3 text-slate-600">{new Date(movement.created_at).toLocaleDateString()}</td>
                          <td className="px-4 py-3 text-slate-600">{movement.product_name}</td>
                          <td className="px-4 py-3">
                            <Badge variant={movement.movement_type === 'in' || movement.movement_type === 'return' || movement.movement_type === 'purchase' ? 'success' : 'danger'}>
                              {movement.movement_type_label || movement.movement_type}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-slate-600">{movement.quantity}</td>
                          <td className="px-4 py-3 text-slate-600">{movement.reference_type || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardBody>
          </Card>
        </div>

        <div>
          <Card>
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-900">Low Stock</h2>
              <Link to="/inventory/low-stock" className="text-xs text-primary hover:underline flex items-center">
                View all <ArrowUpRight className="h-3 w-3 ml-1" />
              </Link>
            </div>
            <CardBody className="p-0">
              {lowStock.length === 0 ? (
                <EmptyState title="No low stock items" description="All products are sufficiently stocked." />
              ) : (
                <div className="divide-y divide-slate-100">
                  {lowStock.slice(0, 8).map((product: Product) => (
                    <Link key={product.id} to={`/products/${product.id}`} className="flex items-center justify-between p-3 hover:bg-slate-50">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">{product.name}</p>
                        <p className="text-xs text-muted">{product.sku}</p>
                      </div>
                      <Badge variant="danger">{product.stock_quantity} left</Badge>
                    </Link>
                  ))}
                </div>
              )}
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  )
}
