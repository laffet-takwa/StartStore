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

/**
 * Checkout body.
 *
 * Only the destination and the payment preference cross the wire - never a
 * price, a total or a user id. `address_id` is retained as the legacy spelling
 * the backend still accepts.
 */
export type CheckoutPayload =
  | { shipping_address_id: UUID; payment_method?: CheckoutPaymentMethod }
  | { shipping_address: ShippingAddress; payment_method?: CheckoutPaymentMethod }

export const CHECKOUT_PAYMENT_METHODS = ['card', 'pay_on_delivery'] as const
export type CheckoutPaymentMethod = (typeof CHECKOUT_PAYMENT_METHODS)[number]

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
  active_repairs?: number
  repairs_pending?: number
  repairs_completed_this_month?: number
}

export interface DashboardResponse {
  metrics: DashboardMetrics
  recent_orders: Order[]
  low_stock_products: ProductSummary[]
}

/* -------------------------------------------------------------------------- */
/* Repairs                                                                    */
/* -------------------------------------------------------------------------- */

export const REPAIR_STATUSES = [
  'received',
  'diagnosis',
  'waiting_customer',
  'approved',
  'repairing',
  'testing',
  'ready',
  'delivered',
  'cancelled',
] as const
export type RepairStatus = (typeof REPAIR_STATUSES)[number]

export const REPAIR_STATUS_META: Record<RepairStatus, StatusMeta> = {
  received: { label: 'Received', className: 'bg-sky-50 text-sky-700 ring-sky-600/20', dot: 'bg-sky-500' },
  diagnosis: { label: 'Diagnosis', className: 'bg-blue-50 text-blue-700 ring-blue-600/20', dot: 'bg-blue-500' },
  waiting_customer: { label: 'Waiting Customer', className: 'bg-amber-50 text-amber-700 ring-amber-600/20', dot: 'bg-amber-500' },
  approved: { label: 'Approved', className: 'bg-indigo-50 text-indigo-700 ring-indigo-600/20', dot: 'bg-indigo-500' },
  repairing: { label: 'Repairing', className: 'bg-orange-50 text-orange-700 ring-orange-600/20', dot: 'bg-orange-500' },
  testing: { label: 'Testing', className: 'bg-purple-50 text-purple-700 ring-purple-600/20', dot: 'bg-purple-500' },
  ready: { label: 'Ready', className: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20', dot: 'bg-emerald-500' },
  delivered: { label: 'Delivered', className: 'bg-zinc-100 text-zinc-700 ring-zinc-500/20', dot: 'bg-zinc-400' },
  cancelled: { label: 'Cancelled', className: 'bg-rose-50 text-rose-700 ring-rose-600/20', dot: 'bg-rose-500' },
}

export interface RepairPart {
  id: UUID
  name: string
  quantity: number
  unit_price: Money
  line_total: Money
}

export interface Repair {
  id: UUID
  ticket_number: string
  customer_id: UUID
  customer_name: string
  customer_phone: string | null
  device_type: string
  device_brand: string
  device_model: string
  serial_number: string | null
  problem_description: string
  accessories: string | null
  physical_condition: string | null
  estimated_cost: Money
  actual_cost: Money | null
  estimated_completion: ISODate | null
  technician_id: UUID | null
  technician_name: string | null
  diagnosis: string | null
  repair_solution: string | null
  status: RepairStatus
  status_display: string
  images: string[]
  internal_notes: string | null
  parts_used: RepairPart[]
  created_at: ISODate
  updated_at: ISODate
}

export interface RepairInput {
  customer_id: UUID
  device_type: string
  device_brand: string
  device_model: string
  serial_number?: string | null
  problem_description: string
  accessories?: string | null
  physical_condition?: string | null
  estimated_cost: string
  estimated_completion?: ISODate | null
  technician_id?: UUID | null
  internal_notes?: string | null
  images?: string[]
}

export interface RepairQuery {
  status?: RepairStatus
  technician?: string
  search?: string
  created_after?: string
  created_before?: string
  ordering?: string
  page?: number
  page_size?: number
}

export interface RepairStatusUpdate {
  status: RepairStatus
  diagnosis?: string | null
  repair_solution?: string | null
  actual_cost?: string | null
  internal_notes?: string | null
}

/* -------------------------------------------------------------------------- */
/* Customers (ERP)                                                            */
/* -------------------------------------------------------------------------- */

export interface Customer {
  id: UUID
  full_name: string
  email: string
  phone: string
  address: string | null
  customer_type: 'individual' | 'business'
  is_active: boolean
  total_repairs: number
  total_purchases: number
  total_spent: Money
  created_at: ISODate
  updated_at: ISODate
}

export interface CustomerInput {
  full_name: string
  email: string
  phone: string
  address?: string | null
  customer_type?: 'individual' | 'business'
  is_active?: boolean
}

export interface CustomerQuery {
  search?: string
  customer_type?: string
  is_active?: boolean
  ordering?: string
  page?: number
  page_size?: number
}

/* -------------------------------------------------------------------------- */
/* Devices                                                                    */
/* -------------------------------------------------------------------------- */

export interface Device {
  id: UUID
  customer_id: UUID
  customer_name: string
  device_type: string
  brand: string
  model: string
  serial_number: string | null
  condition: string | null
  last_repair_id: UUID | null
  last_repair_date: ISODate | null
  created_at: ISODate
  updated_at: ISODate
}

export interface DeviceInput {
  customer_id: UUID
  device_type: string
  brand: string
  model: string
  serial_number?: string | null
  condition?: string | null
}

export interface DeviceQuery {
  customer?: string
  search?: string
  ordering?: string
  page?: number
  page_size?: number
}

/* -------------------------------------------------------------------------- */
/* Inventory                                                                  */
/* -------------------------------------------------------------------------- */

export const STOCK_MOVEMENT_TYPES = [
  'purchase',
  'sale',
  'repair_usage',
  'return',
  'adjustment',
  'damaged',
] as const
export type StockMovementType = (typeof STOCK_MOVEMENT_TYPES)[number]

export interface StockMovement {
  id: UUID
  product_id: UUID
  product_name: string
  product_sku: string | null
  movement_type: StockMovementType
  quantity: number
  reason: string | null
  reference: string | null
  created_by_name: string | null
  created_at: ISODate
}

export interface StockMovementInput {
  product_id: UUID
  movement_type: StockMovementType
  quantity: number
  reason?: string | null
  reference?: string | null
}

export interface InventoryItem {
  product: ProductSummary
  current_stock: number
  minimum_stock: number
  status: 'in_stock' | 'low_stock' | 'out_of_stock'
}

export interface InventoryQuery {
  search?: string
  stock_status?: string
  ordering?: string
  page?: number
  page_size?: number
}

/* -------------------------------------------------------------------------- */
/* Sales & Payments                                                           */
/* -------------------------------------------------------------------------- */

export const SALE_STATUSES = ['draft', 'confirmed', 'cancelled'] as const
export type SaleStatus = (typeof SALE_STATUSES)[number]

export const PAYMENT_METHODS = ['cash', 'card', 'bank_transfer', 'mobile'] as const
export type PaymentMethod = (typeof PAYMENT_METHODS)[number]

export interface SaleItem {
  id: UUID
  product_id: UUID
  product_name: string
  quantity: number
  unit_price: Money
  subtotal: Money
}

export interface Sale {
  id: UUID
  sale_number: string
  customer_id: UUID
  customer_name: string
  employee_id: UUID
  employee_name: string
  items: SaleItem[]
  subtotal: Money
  discount: Money
  tax: Money
  total: Money
  payment_status: PaymentStatus
  payment_method: PaymentMethod | null
  status: SaleStatus
  notes: string | null
  created_at: ISODate
  updated_at: ISODate
}

export interface SaleInput {
  customer_id: UUID
  items: { product_id: UUID; quantity: number }[]
  discount?: string
  tax?: string
  payment_method?: PaymentMethod
  notes?: string | null
}

export interface SaleQuery {
  status?: SaleStatus
  payment_status?: PaymentStatus
  search?: string
  created_after?: string
  created_before?: string
  ordering?: string
  page?: number
  page_size?: number
}

export interface Payment {
  id: UUID
  sale_id: UUID | null
  repair_id: UUID | null
  amount: Money
  method: PaymentMethod
  reference: string | null
  received_by_name: string | null
  created_at: ISODate
}

export interface PaymentInput {
  sale_id?: UUID | null
  repair_id?: UUID | null
  amount: string
  method: PaymentMethod
  reference?: string | null
}

/* -------------------------------------------------------------------------- */
/* Invoices                                                                   */
/* -------------------------------------------------------------------------- */

export const INVOICE_TYPES = ['sale', 'repair', 'proforma'] as const
export type InvoiceType = (typeof INVOICE_TYPES)[number]

export interface Invoice {
  id: UUID
  invoice_number: string
  type: InvoiceType
  sale_id: UUID | null
  repair_id: UUID | null
  customer_id: UUID
  customer_name: string
  subtotal: Money
  tax: Money
  total: Money
  payment_status: PaymentStatus
  issued_at: ISODate
  due_at: ISODate | null
  created_at: ISODate
}

export interface InvoiceQuery {
  type?: InvoiceType
  payment_status?: PaymentStatus
  search?: string
  created_after?: string
  created_before?: string
  ordering?: string
  page?: number
  page_size?: number
}

/* -------------------------------------------------------------------------- */
/* Employees                                                                  */
/* -------------------------------------------------------------------------- */

export const EMPLOYEE_ROLES = ['admin', 'manager', 'technician', 'sales'] as const
export type EmployeeRole = (typeof EMPLOYEE_ROLES)[number]

export interface Employee {
  id: UUID
  full_name: string
  email: string
  phone: string | null
  role: EmployeeRole
  department: string | null
  is_active: boolean
  last_activity: ISODate | null
  hire_date: ISODate | null
  created_at: ISODate
  updated_at: ISODate
}

export interface EmployeeInput {
  full_name: string
  email: string
  phone?: string | null
  role: EmployeeRole
  department?: string | null
  is_active?: boolean
}

export interface EmployeeQuery {
  role?: EmployeeRole
  search?: string
  is_active?: boolean
  ordering?: string
  page?: number
  page_size?: number
}

/* -------------------------------------------------------------------------- */
/* Educational Content                                                        */
/* -------------------------------------------------------------------------- */

export const CONTENT_TYPES = ['article', 'tutorial', 'video'] as const
export type ContentType = (typeof CONTENT_TYPES)[number]

export const CONTENT_STATUSES = ['draft', 'published', 'archived'] as const
export type ContentStatus = (typeof CONTENT_STATUSES)[number]

export interface EducationalContent {
  id: UUID
  title: string
  slug: string
  description: string
  content: string
  content_type: ContentType
  category: string | null
  cover_image_url: string | null
  video_url: string | null
  source_code_url: string | null
  status: ContentStatus
  author_name: string | null
  views: number
  published_at: ISODate | null
  created_at: ISODate
  updated_at: ISODate
}

export interface EducationalContentInput {
  title: string
  description: string
  content: string
  content_type: ContentType
  category?: string | null
  cover_image_url?: string | null
  video_url?: string | null
  source_code_url?: string | null
  status?: ContentStatus
}

export interface EducationalContentQuery {
  content_type?: ContentType
  status?: ContentStatus
  search?: string
  ordering?: string
  page?: number
  page_size?: number
}

/* -------------------------------------------------------------------------- */
/* Robotics Projects                                                          */
/* -------------------------------------------------------------------------- */

export const DIFFICULTY_LEVELS = ['beginner', 'intermediate', 'advanced'] as const
export type DifficultyLevel = (typeof DIFFICULTY_LEVELS)[number]

export interface RoboticsProject {
  id: UUID
  title: string
  slug: string
  description: string
  difficulty: DifficultyLevel
  estimated_cost: Money | null
  components: string
  instructions: string
  image_url: string | null
  video_url: string | null
  source_code_url: string | null
  status: ContentStatus
  views: number
  created_at: ISODate
  updated_at: ISODate
}

export interface RoboticsProjectInput {
  title: string
  description: string
  difficulty: DifficultyLevel
  estimated_cost?: string | null
  components: string
  instructions: string
  image_url?: string | null
  video_url?: string | null
  source_code_url?: string | null
  status?: ContentStatus
}

export interface RoboticsProjectQuery {
  difficulty?: DifficultyLevel
  status?: ContentStatus
  search?: string
  ordering?: string
  page?: number
  page_size?: number
}

/* -------------------------------------------------------------------------- */
/* Notifications                                                              */
/* -------------------------------------------------------------------------- */

export const NOTIFICATION_TYPES = [
  'low_stock',
  'repair_ready',
  'repair_waiting_customer',
  'payment_pending',
  'new_task',
  'system',
] as const
export type NotificationType = (typeof NOTIFICATION_TYPES)[number]

export interface Notification {
  id: UUID
  type: NotificationType
  title: string
  message: string
  entity_type: string | null
  entity_id: UUID | null
  is_read: boolean
  created_at: ISODate
}

export interface NotificationQuery {
  is_read?: boolean
  type?: NotificationType
  ordering?: string
  page?: number
  page_size?: number
}

/* -------------------------------------------------------------------------- */
/* Reports                                                                    */
/* -------------------------------------------------------------------------- */

export interface ReportPeriod {
  label: string
  start: ISODate
  end: ISODate
}

export interface RevenueReport {
  period: ReportPeriod
  total_revenue: Money
  total_orders: number
  total_sales: number
  average_order_value: Money
}

export interface SalesReport {
  period: ReportPeriod
  total_sales: number
  total_revenue: Money
  top_products: { name: string; quantity: number; revenue: Money }[]
}

export interface RepairsReport {
  period: ReportPeriod
  total_repairs: number
  completed: number
  pending: number
  average_cost: Money
  common_types: { device_type: string; count: number }[]
}
