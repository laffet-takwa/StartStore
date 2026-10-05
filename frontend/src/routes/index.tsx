import { createBrowserRouter } from 'react-router-dom'
import { AppLayout } from '@/components/layout/app-layout'
import { ProtectedRoute } from '@/components/common/protected-route'
import { RoleGuard } from '@/components/common/role-guard'
import LoginPage from '@/pages/login'
import DashboardPage from '@/pages/dashboard'
import CustomersPage from '@/pages/customers'
import CustomerDetailPage from '@/pages/customers/detail'
import CustomerEditPage from '@/pages/customers/edit'
import DevicesPage from '@/pages/devices'
import DeviceDetailPage from '@/pages/devices/detail'
import DeviceEditPage from '@/pages/devices/edit'
import RepairsPage from '@/pages/repairs'
import RepairDetailPage from '@/pages/repairs/detail'
import RepairEditPage from '@/pages/repairs/edit'
import ProductsPage from '@/pages/products'
import ProductDetailPage from '@/pages/products/detail'
import ProductEditPage from '@/pages/products/edit'
import CategoriesPage from '@/pages/categories'
import SuppliersPage from '@/pages/suppliers'
import SupplierDetailPage from '@/pages/suppliers/detail'
import SupplierEditPage from '@/pages/suppliers/edit'
import InventoryPage from '@/pages/inventory'
import InventoryMovementsPage from '@/pages/inventory/movements'
import LowStockPage from '@/pages/inventory/low-stock'
import SalesPage from '@/pages/sales'
import SaleDetailPage from '@/pages/sales/detail'
import NewSalePage from '@/pages/sales/new'
import PaymentsPage from '@/pages/payments'
import InvoicesPage from '@/pages/invoices'
import InvoiceDetailPage from '@/pages/invoices/detail'
import NotificationsPage from '@/pages/notifications'
import ReportsPage from '@/pages/reports'
import AuditLogsPage from '@/pages/audit-logs'
import EmployeesPage from '@/pages/employees'
import PublicTrackingPage from '@/pages/track'
import NotFoundPage from '@/pages/not-found'
import { Navigate } from 'react-router-dom'

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/track',
    element: <PublicTrackingPage />,
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <AppLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: 'dashboard', element: <DashboardPage /> },
      { path: 'customers', element: <CustomersPage /> },
      { path: 'customers/new', element: <CustomerEditPage /> },
      { path: 'customers/:id', element: <CustomerDetailPage /> },
      { path: 'customers/:id/edit', element: <CustomerEditPage /> },
      { path: 'devices', element: <DevicesPage /> },
      { path: 'devices/new', element: <DeviceEditPage /> },
      { path: 'devices/:id', element: <DeviceDetailPage /> },
      { path: 'devices/:id/edit', element: <DeviceEditPage /> },
      { path: 'repairs', element: <RepairsPage /> },
      { path: 'repairs/new', element: <RepairEditPage /> },
      { path: 'repairs/:id', element: <RepairDetailPage /> },
      { path: 'repairs/:id/edit', element: <RepairEditPage /> },
      { path: 'products', element: <ProductsPage /> },
      { path: 'products/new', element: <ProductEditPage /> },
      { path: 'products/:id', element: <ProductDetailPage /> },
      { path: 'products/:id/edit', element: <ProductEditPage /> },
      { path: 'categories', element: <CategoriesPage /> },
      { path: 'suppliers', element: <SuppliersPage /> },
      { path: 'suppliers/new', element: <SupplierEditPage /> },
      { path: 'suppliers/:id', element: <SupplierDetailPage /> },
      { path: 'suppliers/:id/edit', element: <SupplierEditPage /> },
      { path: 'inventory', element: <InventoryPage /> },
      { path: 'inventory/movements', element: <InventoryMovementsPage /> },
      { path: 'inventory/low-stock', element: <LowStockPage /> },
      { path: 'sales', element: <SalesPage /> },
      { path: 'sales/new', element: <NewSalePage /> },
      { path: 'sales/:id', element: <SaleDetailPage /> },
      { path: 'payments', element: <PaymentsPage /> },
      { path: 'invoices', element: <InvoicesPage /> },
      { path: 'invoices/:id', element: <InvoiceDetailPage /> },
      { path: 'notifications', element: <NotificationsPage /> },
      { path: 'reports', element: <ReportsPage /> },
      { path: 'audit-logs', element: <AuditLogsPage /> },
      {
        path: 'employees',
        element: (
          <RoleGuard allowedRoles={['admin'] as any[]}>
            <EmployeesPage />
          </RoleGuard>
        ),
      },
    ],
  },
  { path: '*', element: <NotFoundPage /> },
])