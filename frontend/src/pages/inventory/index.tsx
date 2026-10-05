import { useQuery } from '@tanstack/react-query'
import { inventoryApi, productsApi } from '@/api'
import { Warehouse, AlertTriangle, Package, TrendingDown } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { Product } from '@/types'

export default function InventoryPage() {
  const { data: products } = useQuery({
    queryKey: ['products-inventory'],
    queryFn: () => productsApi.list({ page_size: 100 }),
  })

  const lowStock = products?.results?.filter((p: any) => p.is_low_stock) || []
  const totalProducts = products?.results?.length || 0
  const totalValue = products?.results?.reduce((sum: number, p: any) => sum + (p.stock_value || 0), 0) || 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Inventory</h1>
        <p className="text-sm text-muted">Overview of inventory</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-surface rounded-lg border border-slate-200 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted">Total Products</p>
              <p className="text-2xl font-bold text-slate-900">{totalProducts}</p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <Package className="h-5 w-5" />
            </div>
          </div>
        </div>
        <div className="bg-surface rounded-lg border border-slate-200 p-5">
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
        <div className="bg-surface rounded-lg border border-slate-200 p-5">
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

      <div className="bg-surface rounded-lg border border-slate-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-900">Low Stock Items</h2>
          <Link to="/inventory/low-stock" className="text-sm text-primary hover:underline">View all</Link>
        </div>
        {lowStock.length === 0 ? (
          <p className="text-sm text-muted">No low stock items.</p>
        ) : (
          <div className="space-y-3">
            {lowStock.slice(0, 5).map((product: Product) => (
              <Link key={product.id} to={`/products/${product.id}`} className="flex items-center justify-between p-3 rounded-md border border-slate-100 hover:border-primary/20 hover:bg-primary/5 transition-colors">
                <div>
                  <p className="text-sm font-medium text-slate-900">{product.name}</p>
                  <p className="text-xs text-muted">{product.sku}</p>
                </div>
                <span className="text-xs px-2 py-1 rounded-full bg-danger/10 text-danger font-medium">{product.stock_quantity} left</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
