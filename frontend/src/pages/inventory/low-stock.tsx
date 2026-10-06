import { useQuery } from '@tanstack/react-query'
import { productsApi } from '@/api'
import { Link } from 'react-router-dom'
import { Card, CardBody, Badge, EmptyState } from '@/components/ui'
import type { Product } from '@/types'

export default function LowStockPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['products-low-stock'],
    queryFn: () => productsApi.lowStock(),
  })

  const products = (data as Product[]) || []

  return (
    <div className="space-y-4 page-enter">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Low Stock</h1>
        <p className="text-sm text-muted">Products below minimum stock</p>
      </div>

      <Card>
        <CardBody>
          {isLoading ? (
            <div className="p-8 flex justify-center">
              <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : products.length === 0 ? (
            <EmptyState title="All products are above minimum stock" />
          ) : (
            <>
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50">
                      <th className="text-left px-4 py-3 font-medium text-slate-600">Product</th>
                      <th className="text-left px-4 py-3 font-medium text-slate-600">SKU</th>
                      <th className="text-left px-4 py-3 font-medium text-slate-600">Current</th>
                      <th className="text-left px-4 py-3 font-medium text-slate-600">Min</th>
                      <th className="text-left px-4 py-3 font-medium text-slate-600">Value</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {products.map((product) => (
                      <tr key={product.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3">
                          <Link to={`/products/${product.id}`} className="font-medium text-slate-900 hover:text-primary">{product.name}</Link>
                        </td>
                        <td className="px-4 py-3 text-slate-600">{product.sku}</td>
                        <td className="px-4 py-3">
                          <Badge variant="danger">{product.stock_quantity}</Badge>
                        </td>
                        <td className="px-4 py-3 text-slate-600">{product.minimum_stock}</td>
                        <td className="px-4 py-3 text-slate-600">{(product.stock_value || 0).toLocaleString()} TND</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="md:hidden space-y-3">
                {products.map((product) => (
                  <Link key={product.id} to={`/products/${product.id}`} className="block p-4 rounded-lg border border-slate-100 hover:border-primary/20">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-900 truncate">{product.name}</p>
                        <p className="text-xs text-muted">SKU: {product.sku}</p>
                      </div>
                      <Badge variant="danger">{product.stock_quantity} left</Badge>
                    </div>
                    <div className="mt-2 flex items-center justify-between text-xs text-slate-600">
                      <span>Min: {product.minimum_stock}</span>
                      <span>{(product.stock_value || 0).toLocaleString()} TND</span>
                    </div>
                  </Link>
                ))}
              </div>
            </>
          )}
        </CardBody>
      </Card>
    </div>
  )
}
