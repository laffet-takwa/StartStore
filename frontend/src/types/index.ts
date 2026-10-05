/**
 * TypeScript mirrors of the Django REST contract.
 *
 * Every type here corresponds to a real serializer on the backend. Decimal money
 * fields arrive as strings and ids as UUID strings, so they are typed that way
 * rather than as `number` - a deliberate choice that stops accidental float math.
 */

export type UUID = string
/** A `DecimalField` rendered by DRF, e.g. `"129.00"`. */
export type Money = string
export type ISODate = string

/* -------------------------------------------------------------------------- */
/* Envelopes                                                                   */
/* -------------------------------------------------------------------------- */

export interface Paginated<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

export interface ErrorBody {
  code: string
  message: string
  details?: Record<string, unknown> | unknown[]
}

export interface ErrorEnvelope {
  error: ErrorBody
}

/* -------------------------------------------------------------------------- */
/* Enums                                                                       */
/* -------------------------------------------------------------------------- */

export const ORDER_STATUSES = [
  'pending',
  'confirmed',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
] as const
export type OrderStatus = (typeof ORDER_STATUSES)[number]

export const PAYMENT_STATUSES = ['pending', 'paid', 'failed', 'refunded'] as const
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number]

export const USER_ROLES = ['customer', 'admin'] as const
export type UserRole = (typeof USER_ROLES)[number]

/* -------------------------------------------------------------------------- */
/* Identity                                                                    */
/* -------------------------------------------------------------------------- */

export interface Profile {
  id: UUID
  email: string
  full_name: string | null
  phone: string | null
  role: UserRole
  avatar_url: string | null
  created_at: ISODate
  updated_at: ISODate
}

export interface ProfileUpdate {
  full_name?: string | null
  phone?: string | null
  avatar_url?: string | null
}

export interface AuthTokens {
  access: string
  refresh: string
  expires_in: number
}

export interface LoginResponse extends AuthTokens {
  user: Profile
}

export interface LogoutPayload {
  refresh?: string
  supabase_access_token?: string
}

/* -------------------------------------------------------------------------- */
/* Addresses                                                                   */
/* -------------------------------------------------------------------------- */

export interface Address {
  id: UUID
  user_id: UUID
  full_name: string | null
  phone: string | null
  address_line: string
  city: string | null
  postal_code: string | null
  country: string | null
  is_default: boolean
  created_at: ISODate
  updated_at: ISODate
}

export type AddressInput = Omit<Address, 'id' | 'user_id' | 'created_at' | 'updated_at'>

/** Normalised shape stored on `orders.shipping_address`. */
export interface ShippingAddress {
  full_name: string
  phone: string
  address_line: string
  city: string
  postal_code: string
  country: string
}

/* -------------------------------------------------------------------------- */
/* Catalogue                                                                   */
/* -------------------------------------------------------------------------- */

export interface Category {
  id: UUID
  name: string
  slug: string
  description: string | null
  image_url: string | null
  is_active: boolean
  /** Annotated by the list endpoint; absent on a single-row read. */
  product_count?: number
  created_at: ISODate
  updated_at: ISODate
}

export type CategoryInput = {
  name: string
  description?: string | null
  image_url?: string | null
  is_active?: boolean
}

export interface ProductImage {
  id: UUID
  product_id: UUID
  image_url: string
  alt_text: string | null
  display_order: number
}

export type ProductImageInput = {
  image_url: string
  alt_text?: string | null
  display_order?: number
}

/** Fields shared by every product representation the API emits. */
export interface ProductCore {
  id: UUID
  name: string
  slug: string
  sku: string | null
  price: Money
  discount_price: Money | null
  /** Server-computed: the discount price when cheaper, otherwise the list price. */
  final_price: Money
  stock: number
  in_stock: boolean
  image_url: string | null
  is_active: boolean
}

/**
 * Compact shape (`ProductSummarySerializer`) embedded inside carts, wishlists
 * and the dashboard's low-stock list. `category` is a bare id here.
 */
export interface ProductSummary extends ProductCore {
  category: UUID | null
  category_name: string | null
}

/**
 * Full catalogue row (`ProductSerializer`). `category` is the nested object;
 * the writable key on write is `category_id`.
 */
export interface Product extends ProductCore {
  category: Category | null
  description: string | null
  is_on_sale: boolean
  discount_percentage: number
  images: ProductImage[]
  created_at: ISODate
  updated_at: ISODate
}

export type ProductInput = {
  name: string
  category_id?: UUID | null
  description?: string | null
  price: string
  discount_price?: string | null
  stock?: number
  sku?: string | null
  image_url?: string | null
  is_active?: boolean
}

export type ProductOrdering =
  | 'name'
  | '-name'
  | 'price'
  | '-price'
  | 'discount_price'
  | '-discount_price'
  | 'stock'
  | '-stock'
  | 'created_at'
  | '-created_at'

export interface ProductQuery {
  category?: string
  min_price?: number
  max_price?: number
  search?: string
  in_stock?: boolean
  is_on_sale?: boolean
  ordering?: ProductOrdering
  page?: number
  page_size?: number
}

export interface ProductStockUpdate {
  stock: number
  mode?: 'set' | 'increment' | 'decrement'
}

export interface ProductSummaryTotals {
  total: number
  active: number
  inactive: number
  out_of_stock: number
  low_stock: number
  low_stock_threshold: number
  units_in_stock: number
  inventory_value: Money
}

/* -------------------------------------------------------------------------- */
/* Cart                                                                        */
/* -------------------------------------------------------------------------- */

export interface CartItem {
  id: UUID
  product: ProductSummary
  quantity: number
  unit_price: Money
  line_total: Money
  is_available: boolean
  available_quantity: number
  created_at: ISODate
  updated_at: ISODate
}

export interface Cart {
  id: UUID
  items: CartItem[]
  total_items: number
  subtotal: Money
  shipping_cost: Money
  total: Money
  free_shipping_threshold: Money
  currency: string
  created_at: ISODate
  updated_at: ISODate
}

export interface CartItemInput {
  product_id: UUID
  quantity: number
}

/* -------------------------------------------------------------------------- */
/* Wishlist                                                                    */
/* -------------------------------------------------------------------------- */

export interface WishlistEntry {
  id: UUID
  product: ProductSummary
  product_id: UUID
  created_at: ISODate
}

export interface WishlistToggleResult {
  in_wishlist: boolean
  product_id: UUID
  count: number
}

/* -------------------------------------------------------------------------- */
/* Orders                                                                      */
/* -------------------------------------------------------------------------- */

export interface OrderItem {
  id: UUID
  product: UUID | null
  product_id: UUID | null
  product_name: string
  unit_price: Money
  quantity: number
  subtotal: Money
}

export interface Order {
  id: UUID
  order_number: string
  user_id: UUID
  user_email: string
  status: OrderStatus
  status_display: string
  payment_status: PaymentStatus
  payment_status_display: string
  subtotal: Money
  shipping_cost: Money
  total: Money
  shipping_address: ShippingAddress | Record<string, string>
  items: OrderItem[]
  item_count: number
  can_cancel: boolean
  next_statuses: OrderStatus[]
  created_at: ISODate
  updated_at: ISODate
}

/** `/api/orders/` list rows omit the heavy nested collections. */
export type OrderListItem = Omit<Order, 'items' | 'shipping_address'>

export interface OrderQuery {
  status?: OrderStatus
  payment_status?: PaymentStatus
  search?: string
  created_after?: string
  created_before?: string
  ordering?: 'created_at' | '-created_at' | 'total' | '-total' | 'status' | '-status'
  page?: number
  page_size?: number
}

export type CheckoutPayload =
  | { address_id: UUID }
  | { shipping_address: ShippingAddress }

export interface OrderStatusUpdate {
  status: OrderStatus
  payment_status?: PaymentStatus | null
}

/* -------------------------------------------------------------------------- */
/* Admin                                                                       */
/* -------------------------------------------------------------------------- */

export interface AdminProfile extends Profile {
  order_count?: number
  address_count?: number
}

export interface AdminProfileUpdate {
  full_name?: string | null
  phone?: string | null
  avatar_url?: string | null
  role?: UserRole
}

export interface DashboardMetrics {
  generated_at: ISODate
  currency: string
  low_stock_threshold: number
  users_total: number
  users_customers: number
  users_admins: number
  users_new_this_month: number
  categories_total: number
  categories_active: number
  products_total: number
  products_active: number
  out_of_stock: number
  low_stock: number
  on_sale: number
  orders_total: number
  orders_pending: number
  orders_processing: number
  orders_shipped: number
  orders_delivered: number
  orders_cancelled: number
  awaiting_payment: number
  orders_this_month: number
  revenue_total: Money
  revenue_this_month: Money
  revenue_previous_month: Money
  refunded_total: Money
  units_sold: number
  average_order_value: Money
}

export interface DashboardResponse {
  metrics: DashboardMetrics
  recent_orders: Order[]
  low_stock_products: ProductSummary[]
}
