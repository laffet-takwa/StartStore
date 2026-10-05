export type Role = 'admin' | 'manager' | 'technician' | 'sales'

export interface Employee {
  id: string
  email: string
  first_name: string
  last_name: string
  full_name: string
  phone: string
  role: Role
  role_display: string
  avatar?: string
  is_active: boolean
  is_staff: boolean
  date_joined: string
  created_at: string
  updated_at: string
}

export interface Customer {
  id: string
  first_name: string
  last_name: string
  full_name: string
  phone: string
  email?: string
  company_name?: string
  address?: string
  city?: string
  governorate?: string
  postal_code?: string
  notes?: string
  is_active: boolean
  device_count: number
  repair_count: number
  total_spent: number
  created_at: string
  updated_at: string
}

export interface Device {
  id: string
  customer: string
  customer_name: string
  device_type: string
  device_type_display: string
  brand: string
  model: string
  serial_number?: string
  accessories?: string
  physical_condition?: string
  notes?: string
  repair_count: number
  created_at: string
  updated_at: string
}

export type RepairStatus =
  | 'received'
  | 'diagnosis'
  | 'waiting_customer'
  | 'approved'
  | 'repairing'
  | 'testing'
  | 'ready'
  | 'delivered'
  | 'cancelled'

export interface RepairTicket {
  id: string
  ticket_number: string
  tracking_matricule: string
  customer: Customer
  device: Device
  technician?: Employee
  problem_description: string
  diagnosis?: string
  repair_solution?: string
  internal_notes?: string
  status: RepairStatus
  status_label: string
  estimated_cost: number
  final_cost?: number
  estimated_completion_date?: string
  received_at: string
  diagnosed_at?: string
  approved_at?: string
  started_at?: string
  tested_at?: string
  ready_at?: string
  completed_at?: string
  delivered_at?: string
  cancelled_at?: string
  can_transition: string[]
  parts: RepairPart[]
  images: RepairImage[]
  status_history: RepairStatusHistory[]
  created_at: string
  updated_at: string
}

export interface RepairImage {
  id: string
  image: string
  caption?: string
  uploaded_by?: string
  uploaded_by_name?: string
  created_at: string
}

export interface RepairPart {
  id: string
  product: Product
  product_id: string
  quantity: number
  unit_price: number
  total_price: number
  added_by?: string
  added_by_name?: string
  created_at: string
}

export interface RepairStatusHistory {
  id: string
  old_status?: string
  old_status_label?: string
  new_status: string
  new_status_label: string
  changed_by?: string
  changed_by_name?: string
  note?: string
  created_at: string
}

export interface Category {
  id: string
  name: string
  slug: string
  description?: string
  image?: string
  is_active: boolean
  product_count: number
  created_at: string
  updated_at: string
}

export interface Supplier {
  id: string
  name: string
  contact_person?: string
  phone?: string
  email?: string
  address?: string
  city?: string
  notes?: string
  is_active: boolean
  product_count: number
  created_at: string
  updated_at: string
}

export interface Product {
  id: string
  category?: Category
  category_name?: string
  supplier?: Supplier
  supplier_name?: string
  name: string
  sku: string
  barcode?: string
  brand?: string
  description?: string
  purchase_price: number
  selling_price: number
  stock_quantity: number
  minimum_stock: number
  is_low_stock: boolean
  stock_value: number
  image?: string
  images?: ProductImage[]
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface ProductImage {
  id: string
  image: string
  alt_text?: string
  sort_order: number
  created_at: string
}

export interface Sale {
  id: string
  sale_number: string
  customer?: Customer
  customer_name?: string
  employee?: Employee
  employee_name?: string
  subtotal: number
  discount: number
  tax: number
  total: number
  status: 'draft' | 'confirmed' | 'cancelled'
  status_label: string
  payment_status: 'unpaid' | 'partial' | 'paid' | 'refunded'
  payment_status_label: string
  notes?: string
  items: SaleItem[]
  payments: Payment[]
  paid_amount: number
  remaining_amount: number
  items_count: number
  created_at: string
  updated_at: string
  confirmed_at?: string
  cancelled_at?: string
}

export interface SaleItem {
  id: string
  product: Product
  product_id: string
  quantity: number
  unit_price: number
  discount: number
  total_price: number
  created_at: string
}

export type PaymentMethod = 'cash' | 'card' | 'bank_transfer' | 'other'

export interface Payment {
  id: string
  sale?: Sale
  sale_number?: string
  repair?: RepairTicket
  repair_ticket_number?: string
  amount: number
  payment_method: PaymentMethod
  payment_method_label: string
  reference?: string
  notes?: string
  paid_at: string
  created_at: string
}

export interface Invoice {
  id: string
  invoice_number: string
  customer: Customer
  sale?: Sale
  repair?: RepairTicket
  subtotal: number
  discount: number
  tax: number
  total: number
  issued_at: string
  notes?: string
  created_at: string
}

export interface Notification {
  id: string
  employee?: string
  employee_name?: string
  title: string
  message: string
  type: string
  type_label: string
  is_read: boolean
  reference_type?: string
  reference_id?: string
  created_at: string
}

export interface InventoryMovement {
  id: string
  product: string
  product_name: string
  product_sku: string
  movement_type: string
  movement_type_label: string
  quantity: number
  reference_type?: string
  reference_id?: string
  reason?: string
  created_by?: string
  created_by_name?: string
  created_at: string
}

export interface AuditLog {
  id: string
  employee?: string
  employee_name?: string
  action: string
  action_label: string
  entity_type: string
  entity_id?: string
  old_data?: Record<string, unknown>
  new_data?: Record<string, unknown>
  ip_address?: string
  user_agent?: string
  created_at: string
}

export interface DashboardOverview {
  revenue: {
    total: number
    today: number
    month: number
    year: number
  }
  customers: {
    total: number
    new_this_month: number
  }
  repairs: {
    active: number
    completed: number
    pending: number
    in_progress: number
    ready: number
  }
  inventory: {
    total_products: number
    low_stock: number
    out_of_stock: number
  }
  recent_repairs: RepairTicket[]
  recent_sales: Sale[]
  low_stock_products: Product[]
}

export interface PublicRepairTracking {
  matricule: string
  device: {
    type: string
    brand: string
    model: string
  }
  repair: {
    status: string
    status_label: string
    received_at: string
    estimated_completion_date?: string
    last_updated: string
    is_ready_for_pickup: boolean
  }
}

export interface PaginatedResponse<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

export interface ApiError {
  detail?: string
  code?: string
  [key: string]: unknown
}