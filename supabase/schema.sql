-- STAR STORE MANAGER - Supabase Schema
-- Generated from Django models

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================
-- EMPLOYEES (accounts)
-- ============================================
create table public.employees (
  id uuid primary key default uuid_generate_v4(),
  email text unique not null,
  first_name text not null,
  last_name text not null,
  phone text default '',
  role text default 'sales' check (role in ('admin', 'manager', 'technician', 'sales')),
  avatar text,
  is_active boolean default true,
  is_staff boolean default false,
  is_superuser boolean default false,
  password text,
  date_joined timestamptz default now(),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_employees_email on public.employees(email);
create index idx_employees_role on public.employees(role);
create index idx_employees_is_active on public.employees(is_active);

-- ============================================
-- CUSTOMERS (customers)
-- ============================================
create table public.customers (
  id uuid primary key default uuid_generate_v4(),
  first_name text not null,
  last_name text not null,
  phone text not null,
  email text default '',
  company_name text default '',
  address text default '',
  city text default '',
  governorate text default '',
  postal_code text default '',
  notes text default '',
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_customers_phone on public.customers(phone);
create index idx_customers_email on public.customers(email);
create index idx_customers_name on public.customers(last_name, first_name);
create index idx_customers_is_active on public.customers(is_active);
create index idx_customers_governorate on public.customers(governorate);

-- ============================================
-- DEVICES (customers)
-- ============================================
create table public.devices (
  id uuid primary key default uuid_generate_v4(),
  customer uuid not null references public.customers(id) on delete cascade,
  device_type text not null check (device_type in ('laptop', 'desktop', 'tablet', 'printer', 'server', 'phone', 'other')),
  brand text not null,
  model text not null,
  serial_number text default '',
  device_password text default '',
  accessories text default '',
  physical_condition text default '',
  notes text default '',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_devices_customer_type on public.devices(customer, device_type);
create index idx_devices_serial on public.devices(serial_number);
create index idx_devices_brand_model on public.devices(brand, model);

-- ============================================
-- REPAIR TICKETS (repairs)
-- ============================================
create table public.repair_tickets (
  id uuid primary key default uuid_generate_v4(),
  ticket_number text unique not null,
  tracking_matricule text unique not null,
  customer uuid not null references public.customers(id) on delete restrict,
  device uuid not null references public.devices(id) on delete restrict,
  technician uuid references public.employees(id) on delete set null,
  problem_description text not null,
  diagnosis text default '',
  repair_solution text default '',
  internal_notes text default '',
  status text default 'received' check (status in ('received', 'diagnosis', 'waiting_customer', 'approved', 'repairing', 'testing', 'ready', 'delivered', 'cancelled')),
  estimated_cost numeric(12,3) default 0,
  final_cost numeric(12,3),
  estimated_completion_date date,
  received_at timestamptz default now(),
  diagnosed_at timestamptz,
  approved_at timestamptz,
  started_at timestamptz,
  tested_at timestamptz,
  ready_at timestamptz,
  completed_at timestamptz,
  delivered_at timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_repair_tickets_number on public.repair_tickets(ticket_number);
create index idx_repair_tickets_matricule on public.repair_tickets(tracking_matricule);
create index idx_repair_tickets_customer_status on public.repair_tickets(customer, status);
create index idx_repair_tickets_technician_status on public.repair_tickets(technician, status);
create index idx_repair_tickets_status_created on public.repair_tickets(status, created_at);
create index idx_repair_tickets_received_at on public.repair_tickets(received_at);

-- ============================================
-- REPAIR IMAGES (repairs)
-- ============================================
create table public.repair_images (
  id uuid primary key default uuid_generate_v4(),
  repair uuid not null references public.repair_tickets(id) on delete cascade,
  image text not null,
  caption text default '',
  uploaded_by uuid references public.employees(id) on delete set null,
  created_at timestamptz default now()
);

-- ============================================
-- REPAIR PARTS (repairs)
-- ============================================
create table public.repair_parts (
  id uuid primary key default uuid_generate_v4(),
  repair uuid not null references public.repair_tickets(id) on delete cascade,
  product uuid not null references public.products(id) on delete restrict,
  quantity integer default 1 check (quantity > 0),
  unit_price numeric(12,3) not null,
  total_price numeric(12,3) not null,
  added_by uuid references public.employees(id) on delete set null,
  created_at timestamptz default now()
);

-- ============================================
-- REPAIR STATUS HISTORY (repairs)
-- ============================================
create table public.repair_status_history (
  id uuid primary key default uuid_generate_v4(),
  repair uuid not null references public.repair_tickets(id) on delete cascade,
  old_status text check (old_status in ('received', 'diagnosis', 'waiting_customer', 'approved', 'repairing', 'testing', 'ready', 'delivered', 'cancelled')),
  new_status text not null check (new_status in ('received', 'diagnosis', 'waiting_customer', 'approved', 'repairing', 'testing', 'ready', 'delivered', 'cancelled')),
  changed_by uuid references public.employees(id) on delete set null,
  note text default '',
  created_at timestamptz default now()
);

create index idx_repair_status_history_repair_created on public.repair_status_history(repair, created_at);

-- ============================================
-- PUBLIC REPAIR TRACKING (repairs)
-- ============================================
create table public.public_repair_tracking (
  matricule text primary key,
  device_type text not null,
  brand text not null,
  model text not null,
  status text not null check (status in ('received', 'diagnosis', 'waiting_customer', 'approved', 'repairing', 'testing', 'ready', 'delivered', 'cancelled')),
  status_label text not null,
  received_at timestamptz not null,
  estimated_completion_date date,
  last_updated timestamptz not null,
  is_ready_for_pickup boolean default false
);

create index idx_public_repair_tracking_matricule on public.public_repair_tracking(matricule);

-- ============================================
-- CATEGORIES (inventory)
-- ============================================
create table public.categories (
  id uuid primary key default uuid_generate_v4(),
  name text unique not null,
  slug text unique not null,
  description text default '',
  image text,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_categories_slug on public.categories(slug);
create index idx_categories_is_active on public.categories(is_active);

-- ============================================
-- SUPPLIERS (inventory)
-- ============================================
create table public.suppliers (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  contact_person text default '',
  phone text default '',
  email text default '',
  address text default '',
  city text default '',
  notes text default '',
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_suppliers_is_active on public.suppliers(is_active);

-- ============================================
-- PRODUCTS (inventory)
-- ============================================
create table public.products (
  id uuid primary key default uuid_generate_v4(),
  category uuid references public.categories(id) on delete set null,
  supplier uuid references public.suppliers(id) on delete set null,
  name text not null,
  sku text unique not null,
  barcode text unique,
  brand text default '',
  description text default '',
  purchase_price numeric(12,3) default 0,
  selling_price numeric(12,3) default 0,
  stock_quantity integer default 0 check (stock_quantity >= 0),
  minimum_stock integer default 5 check (minimum_stock >= 0),
  image text,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_products_sku on public.products(sku);
create index idx_products_barcode on public.products(barcode);
create index idx_products_category_active on public.products(category, is_active);
create index idx_products_is_active on public.products(is_active);
create index idx_products_stock_quantity on public.products(stock_quantity);

-- ============================================
-- PRODUCT IMAGES (inventory)
-- ============================================
create table public.product_images (
  id uuid primary key default uuid_generate_v4(),
  product uuid not null references public.products(id) on delete cascade,
  image text not null,
  alt_text text default '',
  sort_order integer default 0,
  created_at timestamptz default now()
);

-- ============================================
-- INVENTORY MOVEMENTS (inventory)
-- ============================================
create table public.inventory_movements (
  id uuid primary key default uuid_generate_v4(),
  product uuid not null references public.products(id) on delete cascade,
  movement_type text not null check (movement_type in ('purchase', 'sale', 'repair_usage', 'return', 'adjustment', 'damaged')),
  quantity integer not null,
  reference_type text default '',
  reference_id uuid,
  reason text default '',
  created_by uuid references public.employees(id) on delete set null,
  created_at timestamptz default now()
);

create index idx_inventory_movements_product_created on public.inventory_movements(product, created_at);
create index idx_inventory_movements_type on public.inventory_movements(movement_type);
create index idx_inventory_movements_reference on public.inventory_movements(reference_type, reference_id);
create index idx_inventory_movements_created_at on public.inventory_movements(created_at);

-- ============================================
-- SALES (sales)
-- ============================================
create table public.sales (
  id uuid primary key default uuid_generate_v4(),
  sale_number text unique not null,
  customer uuid references public.customers(id) on delete set null,
  employee uuid references public.employees(id) on delete set null,
  subtotal numeric(12,3) default 0,
  discount numeric(12,3) default 0,
  tax numeric(12,3) default 0,
  total numeric(12,3) default 0,
  status text default 'draft' check (status in ('draft', 'confirmed', 'cancelled')),
  payment_status text default 'unpaid' check (payment_status in ('unpaid', 'partial', 'paid', 'refunded')),
  notes text default '',
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  confirmed_at timestamptz,
  cancelled_at timestamptz
);

create index idx_sales_number on public.sales(sale_number);
create index idx_sales_customer_status on public.sales(customer, status);
create index idx_sales_employee_status on public.sales(employee, status);
create index idx_sales_status_created on public.sales(status, created_at);
create index idx_sales_payment_status on public.sales(payment_status);

-- ============================================
-- SALE ITEMS (sales)
-- ============================================
create table public.sale_items (
  id uuid primary key default uuid_generate_v4(),
  sale uuid not null references public.sales(id) on delete cascade,
  product uuid not null references public.products(id) on delete restrict,
  quantity integer not null check (quantity > 0),
  unit_price numeric(12,3) not null,
  discount numeric(12,3) default 0,
  total_price numeric(12,3) not null,
  created_at timestamptz default now()
);

-- ============================================
-- PAYMENTS (sales)
-- ============================================
create table public.payments (
  id uuid primary key default uuid_generate_v4(),
  sale uuid references public.sales(id) on delete cascade,
  repair uuid references public.repair_tickets(id) on delete cascade,
  amount numeric(12,3) not null,
  payment_method text not null check (payment_method in ('cash', 'card', 'bank_transfer', 'other')),
  reference text default '',
  notes text default '',
  paid_at timestamptz default now(),
  created_at timestamptz default now(),
  check ((sale is not null and repair is null) or (sale is null and repair is not null))
);

create index idx_payments_sale_paid_at on public.payments(sale, paid_at);
create index idx_payments_repair_paid_at on public.payments(repair, paid_at);
create index idx_payments_method on public.payments(payment_method);

-- ============================================
-- INVOICES (invoices)
-- ============================================
create table public.invoices (
  id uuid primary key default uuid_generate_v4(),
  invoice_number text unique not null,
  customer uuid not null references public.customers(id) on delete restrict,
  sale uuid references public.sales(id) on delete set null,
  repair uuid references public.repair_tickets(id) on delete set null,
  subtotal numeric(12,3) default 0,
  discount numeric(12,3) default 0,
  tax numeric(12,3) default 0,
  total numeric(12,3) default 0,
  issued_at timestamptz default now(),
  notes text default '',
  created_at timestamptz default now()
);

create index idx_invoices_number on public.invoices(invoice_number);
create index idx_invoices_customer_issued on public.invoices(customer, issued_at);
create index idx_invoices_sale on public.invoices(sale);
create index idx_invoices_repair on public.invoices(repair);

-- ============================================
-- NOTIFICATIONS (notifications)
-- ============================================
create table public.notifications (
  id uuid primary key default uuid_generate_v4(),
  employee uuid not null references public.employees(id) on delete cascade,
  title text not null,
  message text not null,
  type text default 'info' check (type in ('info', 'warning', 'success', 'error', 'low_stock', 'repair_ready', 'repair_assigned', 'repair_waiting', 'payment_pending')),
  is_read boolean default false,
  reference_type text default '',
  reference_id uuid,
  created_at timestamptz default now()
);

create index idx_notifications_employee_read on public.notifications(employee, is_read);
create index idx_notifications_employee_created on public.notifications(employee, created_at);
create index idx_notifications_type on public.notifications(type);

-- ============================================
-- AUDIT LOGS (audit)
-- ============================================
create table public.audit_logs (
  id uuid primary key default uuid_generate_v4(),
  employee uuid references public.employees(id) on delete set null,
  action text not null check (action in ('create', 'update', 'delete', 'status_change', 'login', 'logout', 'confirm', 'cancel', 'payment', 'invoice', 'inventory_adjustment', 'export')),
  entity_type text not null,
  entity_id uuid,
  old_data jsonb,
  new_data jsonb,
  ip_address inet,
  user_agent text default '',
  created_at timestamptz default now()
);

create index idx_audit_logs_employee_created on public.audit_logs(employee, created_at);
create index idx_audit_logs_entity on public.audit_logs(entity_type, entity_id);
create index idx_audit_logs_action on public.audit_logs(action);
create index idx_audit_logs_created_at on public.audit_logs(created_at);

-- ============================================
-- CONTENT (content)
-- ============================================
create table public.content (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  description text default '',
  content_type text default '',
  category_name text default '',
  is_published boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================
-- ROBOTICS PROJECTS (robotics)
-- ============================================
create table public.robotics_projects (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  description text default '',
  technology text default '',
  status text default '',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================
alter table public.employees enable row level security;
alter table public.customers enable row level security;
alter table public.devices enable row level security;
alter table public.repair_tickets enable row level security;
alter table public.repair_images enable row level security;
alter table public.repair_parts enable row level security;
alter table public.repair_status_history enable row level security;
alter table public.public_repair_tracking enable row level security;
alter table public.categories enable row level security;
alter table public.suppliers enable row level security;
alter table public.products enable row level security;
alter table public.product_images enable row level security;
alter table public.inventory_movements enable row level security;
alter table public.sales enable row level security;
alter table public.sale_items enable row level security;
alter table public.payments enable row level security;
alter table public.invoices enable row level security;
alter table public.notifications enable row level security;
alter table public.audit_logs enable row level security;

-- Policies: authenticated users can read/write most tables
create policy "Authenticated users can read employees" on public.employees for select to authenticated using (true);
create policy "Admins can manage employees" on public.employees for all to authenticated using (
  exists (select 1 from public.employees where id = auth.uid() and role = 'admin')
);

create policy "Authenticated users can read customers" on public.customers for select to authenticated using (true);
create policy "Authenticated users can manage customers" on public.customers for all to authenticated using (true);

create policy "Authenticated users can read devices" on public.devices for select to authenticated using (true);
create policy "Authenticated users can manage devices" on public.devices for all to authenticated using (true);

create policy "Authenticated users can read repair tickets" on public.repair_tickets for select to authenticated using (true);
create policy "Authenticated users can manage repair tickets" on public.repair_tickets for all to authenticated using (true);

create policy "Authenticated users can read repair images" on public.repair_images for select to authenticated using (true);
create policy "Authenticated users can manage repair images" on public.repair_images for all to authenticated using (true);

create policy "Authenticated users can read repair parts" on public.repair_parts for select to authenticated using (true);
create policy "Authenticated users can manage repair parts" on public.repair_parts for all to authenticated using (true);

create policy "Authenticated users can read repair status history" on public.repair_status_history for select to authenticated using (true);
create policy "Authenticated users can manage repair status history" on public.repair_status_history for all to authenticated using (true);

-- Public tracking: allow anon read
create policy "Public can read tracking" on public.public_repair_tracking for select to anon using (true);
create policy "Authenticated users can manage tracking" on public.public_repair_tracking for all to authenticated using (true);

create policy "Authenticated users can read categories" on public.categories for select to authenticated using (true);
create policy "Authenticated users can manage categories" on public.categories for all to authenticated using (true);

create policy "Authenticated users can read suppliers" on public.suppliers for select to authenticated using (true);
create policy "Authenticated users can manage suppliers" on public.suppliers for all to authenticated using (true);

create policy "Authenticated users can read products" on public.products for select to authenticated using (true);
create policy "Authenticated users can manage products" on public.products for all to authenticated using (true);

create policy "Authenticated users can read product images" on public.product_images for select to authenticated using (true);
create policy "Authenticated users can manage product images" on public.product_images for all to authenticated using (true);

create policy "Authenticated users can read inventory movements" on public.inventory_movements for select to authenticated using (true);
create policy "Authenticated users can manage inventory movements" on public.inventory_movements for all to authenticated using (true);

create policy "Authenticated users can read sales" on public.sales for select to authenticated using (true);
create policy "Authenticated users can manage sales" on public.sales for all to authenticated using (true);

create policy "Authenticated users can read sale items" on public.sale_items for select to authenticated using (true);
create policy "Authenticated users can manage sale items" on public.sale_items for all to authenticated using (true);

create policy "Authenticated users can read payments" on public.payments for select to authenticated using (true);
create policy "Authenticated users can manage payments" on public.payments for all to authenticated using (true);

create policy "Authenticated users can read invoices" on public.invoices for select to authenticated using (true);
create policy "Authenticated users can manage invoices" on public.invoices for all to authenticated using (true);

create policy "Employees can read own notifications" on public.notifications for select to authenticated using (employee = auth.uid());
create policy "Employees can manage own notifications" on public.notifications for all to authenticated using (employee = auth.uid());

create policy "Authenticated users can read audit logs" on public.audit_logs for select to authenticated using (true);
create policy "Admins can manage audit logs" on public.audit_logs for all to authenticated using (
  exists (select 1 from public.employees where id = auth.uid() and role = 'admin')
);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to get full name
create or replace function public.get_employee_full_name(emp_id uuid)
returns text as $$
  select concat(first_name, ' ', last_name) from public.employees where id = emp_id;
$$ language sql stable;

-- Function to get customer full name
create or replace function public.get_customer_full_name(cust_id uuid)
returns text as $$
  select concat(first_name, ' ', last_name) from public.customers where id = cust_id;
$$ language sql stable;

-- Function to generate ticket number
create or replace function public.generate_ticket_number()
returns text as $$
declare
  date_part text;
  random_part text;
  ticket_number text;
begin
  date_part := to_char(now(), 'YYYYMMDD');
  random_part := upper(substring(encode(gen_random_bytes(3), 'hex') from 1 for 6));
  ticket_number := concat('REP-', date_part, '-', random_part);
  while exists (select 1 from public.repair_tickets where ticket_number = ticket_number) loop
    random_part := upper(substring(encode(gen_random_bytes(3), 'hex') from 1 for 6));
    ticket_number := concat('REP-', date_part, '-', random_part);
  end loop;
  return ticket_number;
end;
$$ language plpgsql;

-- Function to generate tracking matricule
create or replace function public.generate_tracking_matricule()
returns text as $$
declare
  date_part text;
  random_part text;
  matricule text;
begin
  date_part := to_char(now(), 'YYYYMMDD');
  random_part := upper(substring(encode(gen_random_bytes(3), 'hex') from 1 for 6));
  matricule := concat('ST-', date_part, '-', random_part);
  while exists (select 1 from public.repair_tickets where tracking_matricule = matricule) loop
    random_part := upper(substring(encode(gen_random_bytes(3), 'hex') from 1 for 6));
    matricule := concat('ST-', date_part, '-', random_part);
  end loop;
  return matricule;
end;
$$ language plpgsql;

-- Function to generate sale number
create or replace function public.generate_sale_number()
returns text as $$
declare
  date_part text;
  random_part text;
  sale_number text;
begin
  date_part := to_char(now(), 'YYYYMMDD');
  random_part := upper(substring(encode(gen_random_bytes(3), 'hex') from 1 for 6));
  sale_number := concat('SALE-', date_part, '-', random_part);
  while exists (select 1 from public.sales where sale_number = sale_number) loop
    random_part := upper(substring(encode(gen_random_bytes(3), 'hex') from 1 for 6));
    sale_number := concat('SALE-', date_part, '-', random_part);
  end loop;
  return sale_number;
end;
$$ language plpgsql;

-- Function to generate invoice number
create or replace function public.generate_invoice_number()
returns text as $$
declare
  date_part text;
  random_part text;
  invoice_number text;
begin
  date_part := to_char(now(), 'YYYYMMDD');
  random_part := upper(substring(encode(gen_random_bytes(3), 'hex') from 1 for 6));
  invoice_number := concat('INV-', date_part, '-', random_part);
  while exists (select 1 from public.invoices where invoice_number = invoice_number) loop
    random_part := upper(substring(encode(gen_random_bytes(3), 'hex') from 1 for 6));
    invoice_number := concat('INV-', date_part, '-', random_part);
  end loop;
  return invoice_number;
end;
$$ language plpgsql;

-- Trigger to auto-generate ticket numbers
create or replace function public.set_ticket_numbers()
returns trigger as $$
begin
  if new.ticket_number is null or new.ticket_number = '' then
    new.ticket_number := public.generate_ticket_number();
  end if;
  if new.tracking_matricule is null or new.tracking_matricule = '' then
    new.tracking_matricule := public.generate_tracking_matricule();
  end if;
  return new;
end;
$$ language plpgsql;

create trigger trg_set_ticket_numbers
  before insert on public.repair_tickets
  for each row
  execute function public.set_ticket_numbers();

-- Trigger to auto-generate sale numbers
create or replace function public.set_sale_number()
returns trigger as $$
begin
  if new.sale_number is null or new.sale_number = '' then
    new.sale_number := public.generate_sale_number();
  end if;
  return new;
end;
$$ language plpgsql;

create trigger trg_set_sale_number
  before insert on public.sales
  for each row
  execute function public.set_sale_number();

-- Trigger to auto-generate invoice numbers
create or replace function public.set_invoice_number()
returns trigger as $$
begin
  if new.invoice_number is null or new.invoice_number = '' then
    new.invoice_number := public.generate_invoice_number();
  end if;
  return new;
end;
$$ language plpgsql;

create trigger trg_set_invoice_number
  before insert on public.invoices
  for each row
  execute function public.set_invoice_number();

-- Trigger to update updated_at
create or replace function public.update_updated_at_column()
returns trigger as $$
begin
  new.updated_at := now();
  return new;
end;
$$ language plpgsql;

create trigger trg_employees_updated_at before update on public.employees for each row execute function public.update_updated_at_column();
create trigger trg_customers_updated_at before update on public.customers for each row execute function public.update_updated_at_column();
create trigger trg_devices_updated_at before update on public.devices for each row execute function public.update_updated_at_column();
create trigger trg_repair_tickets_updated_at before update on public.repair_tickets for each row execute function public.update_updated_at_column();
create trigger trg_categories_updated_at before update on public.categories for each row execute function public.update_updated_at_column();
create trigger trg_suppliers_updated_at before update on public.suppliers for each row execute function public.update_updated_at_column();
create trigger trg_products_updated_at before update on public.products for each row execute function public.update_updated_at_column();
create trigger trg_sales_updated_at before update on public.sales for each row execute function public.update_updated_at_column();

-- Trigger to calculate repair part total price
create or replace function public.set_repair_part_total()
returns trigger as $$
begin
  new.total_price := new.unit_price * new.quantity;
  return new;
end;
$$ language plpgsql;

create trigger trg_set_repair_part_total
  before insert or update on public.repair_parts
  for each row
  execute function public.set_repair_part_total();

-- Trigger to calculate sale item total price
create or replace function public.set_sale_item_total()
returns trigger as $$
begin
  new.total_price := (new.unit_price * new.quantity) - new.discount;
  return new;
end;
$$ language plpgsql;

create trigger trg_set_sale_item_total
  before insert or update on public.sale_items
  for each row
  execute function public.set_sale_item_total();

-- ============================================
-- VIEWS for dashboard
-- ============================================

-- Dashboard overview view
create or replace view public.dashboard_overview as
select
  (select coalesce(sum(total), 0) from public.sales where status = 'confirmed') as revenue_total,
  (select coalesce(sum(total), 0) from public.sales where status = 'confirmed' and date(created_at) = current_date) as revenue_today,
  (select coalesce(sum(total), 0) from public.sales where status = 'confirmed' and date_trunc('month', created_at) = date_trunc('month', now())) as revenue_month,
  (select coalesce(sum(total), 0) from public.sales where status = 'confirmed' and date_trunc('year', created_at) = date_trunc('year', now())) as revenue_year,
  (select count(*) from public.customers) as customers_total,
  (select count(*) from public.customers where date_trunc('month', created_at) = date_trunc('month', now())) as customers_new_this_month,
  (select count(*) from public.repair_tickets where status not in ('delivered', 'cancelled')) as repairs_active,
  (select count(*) from public.repair_tickets where status = 'delivered') as repairs_completed,
  (select count(*) from public.repair_tickets where status = 'received') as repairs_pending,
  (select count(*) from public.repair_tickets where status in ('repairing', 'testing')) as repairs_in_progress,
  (select count(*) from public.repair_tickets where status = 'ready') as repairs_ready,
  (select count(*) from public.products) as inventory_total_products,
  (select count(*) from public.products where stock_quantity <= minimum_stock) as inventory_low_stock,
  (select count(*) from public.products where stock_quantity = 0) as inventory_out_of_stock;

-- Revenue by last 7 days view
create or replace view public.revenue_7days as
select
  date(created_at) as date,
  coalesce(sum(total), 0) as total
from public.sales
where status = 'confirmed'
  and created_at >= now() - interval '7 days'
group by date(created_at)
order by date(created_at);

-- Repairs by status view
create or replace view public.repairs_by_status as
select
  status,
  count(*) as count
from public.repair_tickets
group by status;

-- Low stock products view
create or replace view public.low_stock_products as
select *
from public.products
where stock_quantity <= minimum_stock
order by stock_quantity asc;

-- ============================================
-- STORAGE BUCKETS (run in Supabase dashboard or via API)
-- ============================================
-- Buckets to create manually:
-- 1. avatars (employee avatars)
-- 2. repairs (repair images)
-- 3. products (product images)
-- 4. categories (category images)

-- Storage policies (run after creating buckets)
-- These need to be created via Supabase dashboard or API after bucket creation

grant usage on schema public to anon, authenticated;
grant select on all tables in schema public to anon, authenticated;
grant select on all views in schema public to anon, authenticated;
