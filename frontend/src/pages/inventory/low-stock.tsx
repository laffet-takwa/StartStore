import { useQuery } from '@tanstack/react-query'
import { productsApi } from '@/api'
import { AlertTriangle } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function LowStockPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['products-low-stock'],
    queryFn: () => productsApi.lowStock(),
  })

  const products = data as any[] || []

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Low Stock</h1>
        <p className="text-sm text-muted">Products below minimum stock</p>
      </div>

      <div className="bg-surface rounded-lg border border-slate-200">
        {isLoading ? (
          <div className="p-8 flex justify-center">
            <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : products.length === 0 ? (
          <div className="p-8 text-center">
            <AlertTriangle className="h-12 w-12 text-success mx-auto mb-3" />
            <p className="text-muted">All products are above minimum stock.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
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
                {products.map((product: any) => (
                  <tr key={product.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <Link to={`/products/${product.id}`} className="font-medium text-slate-900 hover:text-primary">{product.name}</Link>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{product.sku}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-danger/10 text-danger">{product.stock_quantity}</span>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{product.minimum_stock}</td>
                    <td className="px-4 py-3 text-slate-600">{(product.stock_value || 0).toLocaleString()} TND</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
