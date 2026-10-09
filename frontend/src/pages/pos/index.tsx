import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { productsApi } from '@/api'
import { Search, ShoppingCart, Plus, Minus, CreditCard, Trash2, Package } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardBody, Button, Badge, Input, Skeleton } from '@/components/ui'
import { useCart } from '@/context/cart-context'
import type { Product } from '@/types'

export default function PosPage() {
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const { items, addItem, updateQuantity, clearCart, total, count } = useCart()

  const { data, isLoading } = useQuery({
    queryKey: ['products-pos', search, categoryFilter],
    queryFn: () => productsApi.list({ search, category: categoryFilter, page_size: 100 }),
  })

  const products = (data?.results as Product[]) || []
  const categories = useMemo(() => {
    const cats = new Set<string>()
    products.forEach((p) => { if (p.category_name) cats.add(p.category_name) })
    return Array.from(cats)
  }, [products])

  const cartTotal = total
  const tax = cartTotal * 0.19
  const grandTotal = cartTotal + tax

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col lg:flex-row gap-4 page-enter">
      <div className="flex-1 flex flex-col min-w-0">
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-slate-900">Point of Sale</h1>
          <p className="text-sm text-muted">Select products to add to cart</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products..."
              className="pl-9"
              leftIcon="search"
            />
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-40 rounded-xl" />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="flex items-center justify-center h-64">
              <p className="text-muted">No products found</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {products.map((product) => (
                <motion.div
                  key={product.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.2 }}
                >
                  <div
                    onClick={() => product.stock_quantity > 0 && addItem(product)}
                    className="cursor-pointer h-full flex flex-col"
                  >
                    <Card hover className="h-full flex flex-col">
                      <CardBody className="p-3 flex-1 flex flex-col">
                        <div className="aspect-square rounded-lg bg-slate-100 mb-3 flex items-center justify-center">
                          <Package className="h-8 w-8 text-muted" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-900 truncate">{product.name}</p>
                          <p className="text-xs text-muted mt-0.5">{product.category_name || 'Uncategorized'}</p>
                        </div>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-sm font-semibold text-primary">{product.selling_price.toLocaleString()} TND</span>
                          <Badge variant={product.stock_quantity > 0 ? 'success' : 'danger'} size="xs">
                            {product.stock_quantity > 0 ? `${product.stock_quantity} in stock` : 'Out of stock'}
                          </Badge>
                        </div>
                      </CardBody>
                    </Card>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="lg:w-96 bg-surface border border-slate-200 rounded-xl flex flex-col h-[400px] lg:h-auto">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-primary" />
            <h2 className="font-semibold text-slate-900">Cart</h2>
             {count > 0 && (
               <Badge variant="info" size="sm">{count}</Badge>
             )}
          </div>
          {items.length > 0 && (
            <button onClick={clearCart} className="p-1.5 hover:bg-slate-100 rounded-md">
              <Trash2 className="h-4 w-4 text-danger" />
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <ShoppingCart className="h-12 w-12 text-slate-400 dark:text-slate-600 mb-3" />
              <p className="text-sm text-muted">Cart is empty</p>
              <p className="text-xs text-muted mt-1">Add products to get started</p>
            </div>
          ) : (
            <div className="space-y-3">
              <AnimatePresence>
                {items.map((item) => (
                  <motion.div
                    key={item.product.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="flex items-center gap-3 p-3 rounded-lg border border-slate-100"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">{item.product.name}</p>
                      <p className="text-xs text-muted">{(item.product.selling_price).toLocaleString()} TND each</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                        className="p-1 hover:bg-slate-100 rounded"
                      >
                        <Minus className="h-3.5 w-3.5 text-slate-600" />
                      </button>
                      <span className="text-sm font-medium w-8 text-center">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                        className="p-1 hover:bg-slate-100 rounded"
                        disabled={item.quantity >= item.product.stock_quantity}
                      >
                        <Plus className="h-3.5 w-3.5 text-slate-600" />
                      </button>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-slate-900">
                        {(item.product.selling_price * item.quantity).toLocaleString()} TND
                      </p>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>

        {items.length > 0 && (
          <div className="p-4 border-t border-slate-100 space-y-3">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted">Subtotal</span>
                <span className="font-medium">{cartTotal.toLocaleString()} TND</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted">Tax (19%)</span>
                <span className="font-medium">{tax.toLocaleString()} TND</span>
              </div>
              <div className="flex items-center justify-between text-base font-semibold pt-2 border-t border-slate-100">
                <span>Total</span>
                <span className="text-primary">{grandTotal.toLocaleString()} TND</span>
              </div>
            </div>
             <Button
               className="w-full"
               size="lg"
               icon={<CreditCard className="h-4 w-4" />}
               onClick={() => alert('Checkout functionality will be implemented here')}
             >
               Checkout
             </Button>
          </div>
        )}
      </div>

      <button
        onClick={() => {}}
        className="fixed bottom-20 right-4 lg:right-8 h-14 w-14 rounded-full bg-primary text-white shadow-lg flex items-center justify-center lg:hidden"
        aria-label="Checkout"
      >
        <ShoppingCart className="h-6 w-6" />
        {count > 0 && (
          <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-danger text-white text-xs font-bold flex items-center justify-center">
            {count}
          </span>
        )}
      </button>
    </div>
  )
}
