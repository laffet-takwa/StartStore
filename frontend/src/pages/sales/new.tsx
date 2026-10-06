import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { salesApi, productsApi, customersApi } from '@/api'
import { ArrowLeft, Plus, Trash2, ShoppingCart, User } from 'lucide-react'
import { toast } from 'sonner'
import { Card, CardBody, Button, EmptyState } from '@/components/ui'

interface SaleItemForm {
  product: string
  quantity: number
  unit_price: number
  discount: number
}

export default function NewSalePage() {
  const [customerId, setCustomerId] = useState('')
  const [items, setItems] = useState<SaleItemForm[]>([])
  const [discount, setDiscount] = useState(0)
  const [tax, setTax] = useState(0)
  const [notes, setNotes] = useState('')
  const queryClient = useQueryClient()

  const { data: customersData } = useQuery({
    queryKey: ['customers-list'],
    queryFn: () => customersApi.list({ page_size: 100 }),
  })

  const { data: productsData } = useQuery({
    queryKey: ['products-list'],
    queryFn: () => productsApi.list({ page_size: 100 }),
  })

  const mutation = useMutation({
    mutationFn: (data: any) => salesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] })
      toast.success('Sale created')
      setItems([])
      setCustomerId('')
      setDiscount(0)
      setTax(0)
    },
    onError: () => toast.error('Failed to create sale'),
  })

  const addItem = () => {
    setItems([...items, { product: '', quantity: 1, unit_price: 0, discount: 0 }])
  }

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index))
  }

  const updateItem = (index: number, field: keyof SaleItemForm, value: any) => {
    const newItems = [...items]
    newItems[index] = { ...newItems[index], [field]: value }
    setItems(newItems)
  }

  const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unit_price - item.discount), 0)
  const total = subtotal - discount + tax

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (items.length === 0) {
      toast.error('Add at least one item')
      return
    }
    mutation.mutate({
      customer: customerId || undefined,
      items: items.map(i => ({ ...i, total_price: i.quantity * i.unit_price - i.discount })),
      discount,
      tax,
      notes,
    })
  }

  return (
    <div className="max-w-4xl space-y-4 page-enter">
      <div className="flex items-center gap-4">
        <button onClick={() => window.history.back()} className="p-2 hover:bg-slate-100 rounded-md">
          <ArrowLeft className="h-5 w-5 text-slate-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">New Sale</h1>
          <p className="text-sm text-muted">Create a new sale</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardBody>
            <h2 className="text-sm font-semibold text-slate-900 mb-4 flex items-center gap-2"><User className="h-4 w-4" /> Customer</h2>
            <select
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="">Walk-in Customer</option>
              {customersData?.results?.map((c: any) => (
                <option key={c.id} value={c.id}>{c.first_name} {c.last_name}</option>
              ))}
            </select>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2"><ShoppingCart className="h-4 w-4" /> Items</h2>
              <Button type="button" variant="outline" size="sm" icon={<Plus className="h-4 w-4" />} onClick={addItem}>Add Item</Button>
            </div>
            {items.length === 0 ? (
              <EmptyState title="No items added" description="Add products to this sale." />
            ) : (
              <div className="space-y-3">
                {items.map((item, index) => (
                  <div key={index} className="grid grid-cols-1 md:grid-cols-6 gap-3 items-end">
                    <div className="md:col-span-2">
                      <label className="block text-xs font-medium text-slate-700 mb-1">Product</label>
                      <select
                        value={item.product}
                        onChange={(e) => {
                          const product = productsData?.results?.find((p: any) => p.id === e.target.value)
                          updateItem(index, 'product', e.target.value)
                          if (product) {
                            updateItem(index, 'unit_price', product.selling_price)
                          }
                        }}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                      >
                        <option value="">Select product</option>
                        {productsData?.results?.map((p: any) => (
                          <option key={p.id} value={p.id}>{p.name} - {p.selling_price} TND</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">Qty</label>
                      <input type="number" min="1" value={item.quantity} onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 0)} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">Price</label>
                      <input type="number" step="0.01" value={item.unit_price} onChange={(e) => updateItem(index, 'unit_price', parseFloat(e.target.value) || 0)} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">Discount</label>
                      <input type="number" step="0.01" value={item.discount} onChange={(e) => updateItem(index, 'discount', parseFloat(e.target.value) || 0)} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20" />
                    </div>
                    <div>
                      <Button type="button" variant="danger" size="sm" onClick={() => removeItem(index)} icon={<Trash2 className="h-4 w-4" />} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardBody>
              <h2 className="text-sm font-semibold text-slate-900 mb-4">Totals</h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted">Subtotal</span>
                  <span className="text-sm font-medium text-slate-900">{subtotal.toLocaleString()} TND</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted">Discount</span>
                  <input type="number" step="0.01" value={discount} onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)} className="w-24 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted">Tax</span>
                  <input type="number" step="0.01" value={tax} onChange={(e) => setTax(parseFloat(e.target.value) || 0)} className="w-24 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20" />
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                  <span className="text-base font-semibold text-slate-900">Total</span>
                  <span className="text-base font-bold text-slate-900">{total.toLocaleString()} TND</span>
                </div>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <h2 className="text-sm font-semibold text-slate-900 mb-4">Notes</h2>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={4} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20" />
            </CardBody>
          </Card>
        </div>

        <div className="flex gap-3 justify-end">
          <Button type="button" variant="outline" onClick={() => window.history.back()}>Cancel</Button>
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? 'Creating...' : 'Create Sale'}
          </Button>
        </div>
      </form>
    </div>
  )
}
