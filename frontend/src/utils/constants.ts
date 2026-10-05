import type { OrderStatus, PaymentStatus, UserRole } from '@/types'

export { CURRENCY, LOCALE, STORE_NAME } from './env'

export const ROUTES = {
  home: '/',
  products: '/products',
  product: (id: string) => `/products/${id}`,
  categories: '/categories',
  search: '/search',
  login: '/login',
  register: '/register',
  cart: '/cart',
  wishlist: '/wishlist',
  checkout: '/checkout',
  orders: '/orders',
  order: (id: string) => `/orders/${id}`,
  orderSuccess: (id: string) => `/orders/${id}/success`,
  profile: '/profile',
  addresses: '/addresses',
  admin: {
    root: '/admin',
    dashboard: '/admin',
    repairs: '/admin/repairs',
    repairDetail: (id: string) => `/admin/repairs/${id}`,
    customers: '/admin/customers',
    customerDetail: (id: string) => `/admin/customers/${id}`,
    devices: '/admin/devices',
    deviceDetail: (id: string) => `/admin/devices/${id}`,
    products: '/admin/products',
    productCreate: '/admin/products/new',
    productEdit: (id: string) => `/admin/products/${id}`,
    inventory: '/admin/inventory',
    sales: '/admin/sales',
    saleDetail: (id: string) => `/admin/sales/${id}`,
    invoices: '/admin/invoices',
    invoiceDetail: (id: string) => `/admin/invoices/${id}`,
    employees: '/admin/employees',
    employeeDetail: (id: string) => `/admin/employees/${id}`,
    content: '/admin/content',
    robotics: '/admin/robotics',
    notifications: '/admin/notifications',
    reports: '/admin/reports',
    categories: '/admin/categories',
    orders: '/admin/orders',
    users: '/admin/users',
  },
} as const

/** Pages that require a session. */
export const PROTECTED_ROUTES: readonly string[] = [
  ROUTES.cart,
  ROUTES.wishlist,
  ROUTES.checkout,
  ROUTES.orders,
  ROUTES.profile,
  ROUTES.addresses,
]

/** Customer-only flows: staff order on someone's behalf through the admin API. */
export const CUSTOMER_ONLY_ROUTES: readonly string[] = [ROUTES.checkout]

export interface StatusMeta {
  label: string
  /** Tailwind classes for the pill. */
  className: string
  /** Plain-text colour for charts and dots. */
  dot: string
}

export const ORDER_STATUS_META: Record<OrderStatus, StatusMeta> = {
  pending: {
    label: 'Pending',
    className: 'bg-amber-50 text-amber-700 ring-amber-600/20',
    dot: 'bg-amber-500',
  },
  confirmed: {
    label: 'Confirmed',
    className: 'bg-blue-50 text-blue-700 ring-blue-600/20',
    dot: 'bg-blue-500',
  },
  processing: {
    label: 'Processing',
    className: 'bg-indigo-50 text-indigo-700 ring-indigo-600/20',
    dot: 'bg-indigo-500',
  },
  shipped: {
    label: 'Shipped',
    className: 'bg-violet-50 text-violet-700 ring-violet-600/20',
    dot: 'bg-violet-500',
  },
  delivered: {
    label: 'Delivered',
    className: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
    dot: 'bg-emerald-500',
  },
  cancelled: {
    label: 'Cancelled',
    className: 'bg-zinc-100 text-zinc-600 ring-zinc-500/20',
    dot: 'bg-zinc-400',
  },
}

export const PAYMENT_STATUS_META: Record<PaymentStatus, StatusMeta> = {
  pending: {
    label: 'Awaiting payment',
    className: 'bg-amber-50 text-amber-700 ring-amber-600/20',
    dot: 'bg-amber-500',
  },
  paid: {
    label: 'Paid',
    className: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
    dot: 'bg-emerald-500',
  },
  failed: {
    label: 'Failed',
    className: 'bg-rose-50 text-rose-700 ring-rose-600/20',
    dot: 'bg-rose-500',
  },
  refunded: {
    label: 'Refunded',
    className: 'bg-zinc-100 text-zinc-600 ring-zinc-500/20',
    dot: 'bg-zinc-400',
  },
}

export const ROLE_META: Record<UserRole, StatusMeta> = {
  customer: {
    label: 'Customer',
    className: 'bg-zinc-100 text-zinc-700 ring-zinc-500/20',
    dot: 'bg-zinc-400',
  },
  admin: {
    label: 'Admin',
    className: 'bg-brand-50 text-brand-700 ring-brand-600/20',
    dot: 'bg-brand-500',
  },
}

/** Customer-facing progress rail for the order lifecycle. */
export const ORDER_FLOW: OrderStatus[] = [
  'pending',
  'confirmed',
  'processing',
  'shipped',
  'delivered',
]

export const SORT_OPTIONS = [
  { value: '', label: 'Featured' },
  { value: 'created_at', label: 'Newest' },
  { value: '-created_at', label: 'Oldest' },
  { value: 'price', label: 'Price: low to high' },
  { value: '-price', label: 'Price: high to low' },
  { value: 'name', label: 'Name: A to Z' },
  { value: '-name', label: 'Name: Z to A' },
] as const

export const PAGE_SIZE = 12
export const MAX_PAGE_SIZE = 100

export const ORDER_PAGE_SIZE = 10
export const ADMIN_PAGE_SIZE = 20

/** Stock at or below this reads as "running low" in the storefront. */
export const LOW_STOCK_THRESHOLD = 5
