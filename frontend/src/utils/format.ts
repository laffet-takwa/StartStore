/** Presentation helpers. All money arrives from the API as decimal strings. */

import { CURRENCY, LOCALE } from './constants'

/**
 * Format a decimal string for display. `Intl.NumberFormat` is used rather than
 * `parseFloat` so large or high-precision values never lose cents.
 */
export function formatMoney(value: string | number | null | undefined, currency = CURRENCY): string {
  if (value === null || value === undefined || value === '') return formatMoney(0, currency)
  const amount = typeof value === 'number' ? value : Number.parseFloat(value)
  if (Number.isNaN(amount)) return formatMoney(0, currency)
  return new Intl.NumberFormat(LOCALE, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

/** Bare number with no currency symbol, for input fields. */
export function formatNumber(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === '') return '0'
  const amount = typeof value === 'number' ? value : Number.parseFloat(value)
  if (Number.isNaN(amount)) return '0'
  return new Intl.NumberFormat(LOCALE, { maximumFractionDigits: 2 }).format(amount)
}

export function formatCompactNumber(value: number): string {
  return new Intl.NumberFormat(LOCALE, { notation: 'compact', maximumFractionDigits: 1 }).format(value)
}

const DATE_FORMAT: Intl.DateTimeFormatOptions = {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return new Intl.DateTimeFormat(LOCALE, DATE_FORMAT).format(date)
}

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return new Intl.DateTimeFormat(LOCALE, {
    ...DATE_FORMAT,
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

/** "2 hours ago" / "in 3 days", for order timelines. */
export function formatRelative(value: string | null | undefined): string {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  const diffMs = date.getTime() - Date.now()
  const abs = Math.abs(diffMs)
  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ['year', 31536000000],
    ['month', 2592000000],
    ['day', 86400000],
    ['hour', 3600000],
    ['minute', 60000],
  ]
  const formatter = new Intl.RelativeTimeFormat(LOCALE, { numeric: 'auto' })
  for (const [unit, ms] of units) {
    if (abs >= ms) return formatter.format(Math.round(diffMs / ms), unit)
  }
  return formatter.format(0, 'minute')
}

/** Percentage saved, guarding against a zero list price. */
export function discountPercent(price: string, discountPrice: string | null): number {
  if (!discountPrice) return 0
  const list = Number.parseFloat(price)
  const sale = Number.parseFloat(discountPrice)
  if (!list || Number.isNaN(list) || Number.isNaN(sale) || sale >= list) return 0
  return Math.round(((list - sale) / list) * 100)
}

export function initials(name: string | null | undefined, email?: string | null): string {
  const source = (name ?? '').trim() || (email ?? '').trim()
  if (!source) return '?'
  const parts = source.split(/[\s@._-]+/).filter(Boolean)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[1][0]).toUpperCase()
}

export function pluralize(count: number, singular: string, plural = `${singular}s`): string {
  return `${formatNumber(count)} ${count === 1 ? singular : plural}`
}

export function truncate(value: string, max = 120): string {
  if (value.length <= max) return value
  return `${value.slice(0, max - 1).trimEnd()}…`
}

/** Turn a label into a URL slug, for breadcrumb links. */
export function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}
