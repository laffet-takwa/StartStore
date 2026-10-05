import { useEffect, useState } from 'react'
import { Check, SlidersHorizontal, X } from 'lucide-react'

import { Button, Checkbox, Input } from '@/components/common'
import { Badge } from '@/components/common/Display'
import { Drawer } from '@/components/common/Overlay'
import { useIsMobile } from '@/hooks/useMediaQuery'
import { cn } from '@/lib/cn'
import type { Category } from '@/types'
import { SORT_OPTIONS } from '@/utils/constants'
import type { ProductFilters } from '@/hooks/useProductFilters'

const PRICE_PRESETS = [
  { label: 'Under $50', min: undefined, max: 50 },
  { label: '$50 – $150', min: 50, max: 150 },
  { label: '$150 – $400', min: 150, max: 400 },
  { label: 'Over $400', min: 400, max: undefined },
]

export interface FilterPanelProps {
  filters: ProductFilters
  categories: Category[]
  onChange: (next: Partial<ProductFilters>) => void
  onClear: () => void
  activeCount: number
}

/**
 * Filter panel, shared between the desktop sidebar and the mobile drawer.
 *
 * Price inputs are local state that only commit on blur or submit: typing "1"
 * mid-way to "150" should not fire a request per keystroke.
 */
export function FilterPanel({
  filters,
  categories,
  onChange,
  onClear,
  activeCount,
}: FilterPanelProps) {
  const [minPrice, setMinPrice] = useState(filters.min_price?.toString() ?? '')
  const [maxPrice, setMaxPrice] = useState(filters.max_price?.toString() ?? '')

  // Keep the inputs in step when filters are cleared or restored from the URL.
  useEffect(() => {
    setMinPrice(filters.min_price?.toString() ?? '')
    setMaxPrice(filters.max_price?.toString() ?? '')
  }, [filters.min_price, filters.max_price])

  const applyPrice = () => {
    const min = minPrice.trim() ? Number(minPrice) : undefined
    const max = maxPrice.trim() ? Number(maxPrice) : undefined
    const cleanMin = min !== undefined && Number.isFinite(min) && min > 0 ? min : undefined
    const cleanMax = max !== undefined && Number.isFinite(max) && max > 0 ? max : undefined
    onChange({ min_price: cleanMin, max_price: cleanMax })
  }

  const activeCategoryId = categories.find((category) => category.slug === filters.category)?.id
  const visibleCategories = categories.filter(
    (category) => !activeCategoryId || category.id === activeCategoryId || category.is_active,
  )

  return (
    <div className="space-y-7">
      <FilterSection title="Category">
        <ul className="space-y-0.5">
          <li>
            <button
              type="button"
              onClick={() => onChange({ category: undefined })}
              className={cn(
                'flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-sm transition-colors',
                !filters.category ? 'bg-brand-50 font-medium text-brand-700' : 'text-ink-soft hover:bg-zinc-50',
              )}
            >
              All products
            </button>
          </li>
          {visibleCategories.map((category) => {
            const active = filters.category === category.slug || filters.category === category.id
            return (
              <li key={category.id}>
                <button
                  type="button"
                  onClick={() =>
                    onChange({ category: active ? undefined : (category.slug ?? category.id) })
                  }
                  className={cn(
                    'flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-sm transition-colors',
                    active ? 'bg-brand-50 font-medium text-brand-700' : 'text-ink-soft hover:bg-zinc-50',
                  )}
                >
                  <span className="truncate">{category.name}</span>
                  {typeof category.product_count === 'number' && (
                    <span className="ml-2 shrink-0 text-2xs text-ink-faint">
                      {category.product_count}
                    </span>
                  )}
                </button>
              </li>
            )
          })}
        </ul>
      </FilterSection>

      <FilterSection title="Price">
        <div className="flex items-center gap-2">
          <Input
            type="number"
            inputMode="numeric"
            min={0}
            placeholder="Min"
            value={minPrice}
            aria-label="Minimum price"
            onChange={(event) => setMinPrice(event.target.value)}
            onBlur={applyPrice}
            onKeyDown={(event) => event.key === 'Enter' && applyPrice()}
            className="h-10"
          />
          <span className="text-ink-faint" aria-hidden>
            –
          </span>
          <Input
            type="number"
            inputMode="numeric"
            min={0}
            placeholder="Max"
            value={maxPrice}
            aria-label="Maximum price"
            onChange={(event) => setMaxPrice(event.target.value)}
            onBlur={applyPrice}
            onKeyDown={(event) => event.key === 'Enter' && applyPrice()}
            className="h-10"
          />
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {PRICE_PRESETS.map((preset) => {
            const active = filters.min_price === preset.min && filters.max_price === preset.max
            return (
              <button
                key={preset.label}
                type="button"
                onClick={() =>
                  onChange(
                    active
                      ? { min_price: undefined, max_price: undefined }
                      : { min_price: preset.min, max_price: preset.max },
                  )
                }
                className={cn(
                  'rounded-full border px-2.5 py-1 text-2xs font-medium transition-colors',
                  active
                    ? 'border-brand-600 bg-brand-50 text-brand-700'
                    : 'border-zinc-300 text-ink-soft hover:border-zinc-400 hover:bg-zinc-50',
                )}
              >
                {preset.label}
              </button>
            )
          })}
        </div>
      </FilterSection>

      <FilterSection title="Availability">
        <div className="space-y-3">
          <Checkbox
            label="In stock only"
            checked={filters.in_stock ?? false}
            onChange={(event) => onChange({ in_stock: event.target.checked || undefined })}
          />
          <Checkbox
            label="On sale"
            checked={filters.is_on_sale ?? false}
            onChange={(event) => onChange({ is_on_sale: event.target.checked || undefined })}
          />
        </div>
      </FilterSection>

      {activeCount > 0 && (
        <Button variant="outline" size="sm" fullWidth leftIcon={<X className="h-4 w-4" />} onClick={onClear}>
          Clear all filters
        </Button>
      )}
    </div>
  )
}

function FilterSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-[0.1em] text-ink">
        {title}
      </h3>
      {children}
    </section>
  )
}

/* -------------------------------------------------------------------------- */
/* Toolbar                                                                      */
/* -------------------------------------------------------------------------- */

export function ProductToolbar({
  filters,
  onChange,
  onClear,
  activeCount,
  resultCount,
  totalCount,
}: {
  filters: ProductFilters
  onChange: (next: Partial<ProductFilters>) => void
  onClear: () => void
  activeCount: number
  resultCount: number
  totalCount: number
}) {
  const isMobile = useIsMobile()
  const [drawerOpen, setDrawerOpen] = useState(false)

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          size="sm"
          className="lg:hidden"
          leftIcon={<SlidersHorizontal className="h-4 w-4" />}
          onClick={() => setDrawerOpen(true)}
        >
          Filters
          {activeCount > 0 && (
            <Badge variant="brand" className="ml-1">
              {activeCount}
            </Badge>
          )}
        </Button>
        <p className="text-sm text-ink-muted">
          {activeCount > 0 ? (
            <>
              <span className="font-medium text-ink">{resultCount}</span> of {totalCount} products
            </>
          ) : (
            <>
              <span className="font-medium text-ink">{totalCount}</span> products
            </>
          )}
        </p>
      </div>

      <div className="flex items-center gap-2">
        {activeCount > 0 && (
          <Button variant="ghost" size="sm" onClick={onClear}>
            Clear
          </Button>
        )}
        <label className="flex items-center gap-2 text-sm">
          <span className="hidden text-ink-muted sm:inline">Sort</span>
          <select
            value={filters.ordering ?? ''}
            onChange={(event) =>
              onChange({ ordering: (event.target.value || undefined) as never })
            }
            aria-label="Sort products"
            className="h-9 cursor-pointer rounded-lg border border-zinc-300 bg-white pl-3 pr-8 text-sm text-ink transition-colors hover:border-zinc-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {isMobile && (
        <Drawer
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          title={<span className="font-semibold text-ink">Filters</span>}
          footer={
            <Button fullWidth onClick={() => setDrawerOpen(false)}>
              Show {resultCount} results
            </Button>
          }
        >
          <div className="p-5">
            <FilterPanel
              filters={filters}
              categories={[]}
              onChange={onChange}
              onClear={onClear}
              activeCount={activeCount}
            />
          </div>
        </Drawer>
      )}
    </div>
  )
}

/** Desktop sidebar wrapper. */
export function FilterSidebar(props: FilterPanelProps) {
  return (
    <aside className="hidden w-60 shrink-0 lg:block">
      <div className="sticky top-28">
        <FilterPanel {...props} />
      </div>
    </aside>
  )
}

/** Chips summarising the active filters, with individual remove buttons. */
export function ActiveFilterChips({
  filters,
  categories,
  onChange,
  onClear,
}: {
  filters: ProductFilters
  categories: Category[]
  onChange: (next: Partial<ProductFilters>) => void
  onClear: () => void
}) {
  const category = categories.find(
    (entry) => entry.slug === filters.category || entry.id === filters.category,
  )

  const chips: { label: string; clear: Partial<ProductFilters> }[] = []
  if (filters.search) chips.push({ label: `“${filters.search}”`, clear: { search: undefined } })
  if (category) chips.push({ label: category.name, clear: { category: undefined } })
  if (filters.min_price !== undefined || filters.max_price !== undefined) {
    chips.push({
      label: `$${filters.min_price ?? 0} – ${filters.max_price ? `$${filters.max_price}` : 'any'}`,
      clear: { min_price: undefined, max_price: undefined },
    })
  }
  if (filters.in_stock) chips.push({ label: 'In stock', clear: { in_stock: undefined } })
  if (filters.is_on_sale) chips.push({ label: 'On sale', clear: { is_on_sale: undefined } })

  if (!chips.length) return null

  return (
    <div className="flex flex-wrap items-center gap-2">
      {chips.map((chip) => (
        <button
          key={chip.label}
          type="button"
          onClick={() => onChange(chip.clear)}
          className="inline-flex items-center gap-1.5 rounded-full bg-zinc-100 py-1 pl-2.5 pr-1.5 text-2xs font-medium text-ink-soft transition-colors hover:bg-zinc-200"
        >
          {chip.label}
          <X className="h-3 w-3" aria-hidden />
          <span className="sr-only">Remove filter</span>
        </button>
      ))}
      <button
        type="button"
        onClick={onClear}
        className="text-2xs font-semibold text-brand-700 underline-offset-4 hover:underline"
      >
        Clear all
      </button>
    </div>
  )
}

/** Re-exported so pages can show a "filters applied" hint on mobile. */
export { Check }
