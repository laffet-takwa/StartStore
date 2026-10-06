import { useState, useEffect, useRef, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { customersApi, repairsApi, devicesApi, productsApi, salesApi, invoicesApi } from '@/api'
import { Search, ArrowRight, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { Customer, RepairTicket, Device, Product, Sale, Invoice } from '@/types'

type ResultItem =
  | { type: 'customer'; data: Customer }
  | { type: 'repair'; data: RepairTicket }
  | { type: 'device'; data: Device }
  | { type: 'product'; data: Product }
  | { type: 'sale'; data: Sale }
  | { type: 'invoice'; data: Invoice }

const ENTITY_LABELS: Record<string, string> = {
  customer: 'Customers',
  repair: 'Repairs',
  device: 'Devices',
  product: 'Products',
  sale: 'Sales',
  invoice: 'Invoices',
}

const ROUTES: Record<string, string> = {
  customer: '/customers',
  repair: '/repairs',
  device: '/devices',
  product: '/products',
  sale: '/sales',
  invoice: '/invoices',
}

export function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  const customersQuery = useQuery({ queryKey: ['search-customers'], queryFn: () => customersApi.list({ page_size: 50 }), enabled: open })
  const repairsQuery = useQuery({ queryKey: ['search-repairs'], queryFn: () => repairsApi.list({ page_size: 50 }), enabled: open })
  const devicesQuery = useQuery({ queryKey: ['search-devices'], queryFn: () => devicesApi.list({ page_size: 50 }), enabled: open })
  const productsQuery = useQuery({ queryKey: ['search-products'], queryFn: () => productsApi.list({ page_size: 50 }), enabled: open })
  const salesQuery = useQuery({ queryKey: ['search-sales'], queryFn: () => salesApi.list({ page_size: 50 }), enabled: open })
  const invoicesQuery = useQuery({ queryKey: ['search-invoices'], queryFn: () => invoicesApi.list({ page_size: 50 }), enabled: open })

  const items = useMemo<ResultItem[]>(() => {
    if (!query.trim()) return []
    const q = query.toLowerCase()
    const out: ResultItem[] = []

    const push = (type: ResultItem['type'], data: any) => {
      let text = ''
      let title = ''
      let sub = ''

      if (type === 'customer') {
        title = `${data.first_name} ${data.last_name}`
        sub = data.phone
        text = `${title} ${sub} ${data.email || ''} ${data.company_name || ''}`.toLowerCase()
      } else if (type === 'repair') {
        title = data.ticket_number
        sub = `${data.customer?.first_name || ''} ${data.customer?.last_name || ''}`
        text = `${title} ${sub} ${data.device?.brand || ''} ${data.device?.model || ''}`.toLowerCase()
      } else if (type === 'device') {
        title = `${data.brand} ${data.model}`
        sub = data.serial_number || ''
        text = `${title} ${sub} ${data.customer?.first_name || ''} ${data.customer?.last_name || ''}`.toLowerCase()
      } else if (type === 'product') {
        title = data.name
        sub = data.sku
        text = `${title} ${sub} ${data.category_name || ''}`.toLowerCase()
      } else if (type === 'sale') {
        title = data.sale_number
        sub = data.customer_name || ''
        text = `${title} ${sub}`.toLowerCase()
      } else if (type === 'invoice') {
        title = data.invoice_number
        sub = `${data.customer?.first_name || ''} ${data.customer?.last_name || ''}`
        text = `${title} ${sub}`.toLowerCase()
      }

      if (text.includes(q)) out.push({ type, data: { ...data, _title: title, _sub: sub } as any })
    }

    customersQuery.data?.results?.forEach((c) => push('customer', c))
    repairsQuery.data?.results?.forEach((r) => push('repair', r))
    devicesQuery.data?.results?.forEach((d) => push('device', d))
    productsQuery.data?.results?.forEach((p) => push('product', p))
    salesQuery.data?.results?.forEach((s) => push('sale', s))
    invoicesQuery.data?.results?.forEach((i) => push('invoice', i))

    return out
  }, [query, customersQuery.data, repairsQuery.data, devicesQuery.data, productsQuery.data, salesQuery.data, invoicesQuery.data])

  useEffect(() => {
    if (open) {
      setQuery('')
      setSelectedIndex(0)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex((i) => Math.min(i + 1, items.length - 1))
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex((i) => Math.max(i - 1, 0))
      }
      if (e.key === 'Enter') {
        e.preventDefault()
        const selected = items[selectedIndex]
        if (selected) {
          const href = ROUTES[selected.type]
          if (href) {
            window.location.href = href
            onClose()
          }
        }
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onClose, items, selectedIndex])

  useEffect(() => {
    if (listRef.current) {
      const selected = listRef.current.querySelector(`[data-index="${selectedIndex}"]`)
      selected?.scrollIntoView({ block: 'nearest' })
    }
  }, [selectedIndex])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[60]">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="absolute inset-x-0 top-[5vh] sm:top-[10vh] mx-auto max-w-2xl bg-surface rounded-xl shadow-2xl border border-slate-200 overflow-hidden animate-scale-in max-h-[85vh] flex flex-col">
        <div className="flex items-center gap-3 px-4 border-b border-slate-200">
          <Search className="h-4 w-4 text-muted" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => { setQuery(e.target.value); setSelectedIndex(0) }}
            placeholder="Search customers, repairs, products, sales, invoices..."
            className="w-full py-3 text-sm bg-transparent outline-none"
          />
          <kbd className="hidden sm:inline-flex items-center rounded border border-slate-200 px-1.5 py-0.5 text-[10px] text-muted">ESC</kbd>
          <button onClick={onClose} className="p-1 rounded hover:bg-slate-100">
            <X className="h-4 w-4 text-muted" />
          </button>
        </div>

        <div ref={listRef} className="overflow-y-auto flex-1">
          {items.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted">
              {query.trim() ? 'No results found' : 'Start typing to search'}
            </div>
          ) : (
            <div className="py-2">
              {items.map((item, idx) => {
                const href = ROUTES[item.type]
                const title = (item.data as any)._title || ''
                const sub = (item.data as any)._sub || ''
                const isSelected = idx === selectedIndex
                return (
                  <Link
                    key={`${item.type}-${item.data.id}-${idx}`}
                    to={href}
                    onClick={onClose}
                    data-index={idx}
                    className={`flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                      isSelected ? 'bg-primary/5 text-primary' : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{title}</p>
                      {sub && <p className="text-xs text-muted truncate">{sub}</p>}
                    </div>
                    <span className="text-[10px] uppercase tracking-wide text-muted">{ENTITY_LABELS[item.type]}</span>
                    <ArrowRight className="h-3 w-3 text-muted" />
                  </Link>
                )
              })}
            </div>
          )}
        </div>

        <div className="hidden sm:flex items-center justify-between px-4 py-2 border-t border-slate-200 text-[11px] text-muted">
          <span>
            <kbd className="rounded border border-slate-200 px-1 py-0.5">↑↓</kbd> to navigate
            <span className="mx-1">·</span>
            <kbd className="rounded border border-slate-200 px-1 py-0.5">↵</kbd> to open
          </span>
          <span>Searching across {Object.keys(ENTITY_LABELS).length} sections</span>
        </div>
      </div>
    </div>
  )
}
