import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { inventoryApi } from '@/api'
import { Search, Filter } from 'lucide-react'
import { Card, CardBody, Badge, Button, EmptyState } from '@/components/ui'
import type { InventoryMovement } from '@/types'

export default function InventoryMovementsPage() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['inventory-movements', page, search, typeFilter],
    queryFn: () => inventoryApi.movements({ page, search, movement_type: typeFilter, page_size: 20 }),
  })

  return (
    <div className="space-y-4 page-enter">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Inventory Movements</h1>
        <p className="text-sm text-muted">Track stock movements</p>
      </div>

      <Card>
        <CardBody className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted" />
              <input
                type="text"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1) }}
                placeholder="Search movements..."
                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted" />
              <select
                value={typeFilter}
                onChange={(e) => { setTypeFilter(e.target.value); setPage(1) }}
                className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="">All Types</option>
                <option value="purchase">Purchase</option>
                <option value="sale">Sale</option>
                <option value="adjustment">Adjustment</option>
                <option value="transfer">Transfer</option>
              </select>
            </div>
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
                      <th className="text-left px-4 py-3 font-medium text-slate-600">Type</th>
                      <th className="text-left px-4 py-3 font-medium text-slate-600">Quantity</th>
                      <th className="text-left px-4 py-3 font-medium text-slate-600">Reference</th>
                      <th className="text-left px-4 py-3 font-medium text-slate-600">Reason</th>
                      <th className="text-left px-4 py-3 font-medium text-slate-600">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {data?.results?.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-8">
                          <EmptyState title="No movements found" description="Try adjusting your search or filters." />
                        </td>
                      </tr>
                    ) : (
                      data?.results?.map((movement: InventoryMovement) => (
                        <tr key={movement.id} className="hover:bg-slate-50">
                          <td className="px-4 py-3 font-medium text-slate-900">{movement.product_name}</td>
                          <td className="px-4 py-3">
                            <Badge variant={movement.quantity > 0 ? 'success' : 'danger'}>
                              {movement.movement_type_label}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-slate-600">{movement.quantity > 0 ? '+' : ''}{movement.quantity}</td>
                          <td className="px-4 py-3 text-slate-600">{movement.reference_type || '-'}</td>
                          <td className="px-4 py-3 text-slate-600">{movement.reason || '-'}</td>
                          <td className="px-4 py-3 text-slate-600">{new Date(movement.created_at).toLocaleString()}</td>
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
                  <EmptyState title="No movements found" description="Try adjusting your search or filters." />
                </CardBody>
              </Card>
            ) : (
              data?.results?.map((movement: InventoryMovement) => (
                <Card key={movement.id} hover className="animate-slide-up">
                  <CardBody className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-900">{movement.product_name}</p>
                        <p className="text-xs text-muted mt-0.5">{movement.reason || 'No reason'}</p>
                      </div>
                      <Badge variant={movement.quantity > 0 ? 'success' : 'danger'}>
                        {movement.movement_type_label}
                      </Badge>
                    </div>
                    <div className="mt-3 flex items-center justify-between text-xs text-slate-600">
                      <span>Qty: {movement.quantity > 0 ? '+' : ''}{movement.quantity}</span>
                      <span>{new Date(movement.created_at).toLocaleDateString()}</span>
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
    </div>
  )
}
