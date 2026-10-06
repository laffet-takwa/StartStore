import { Suspense, lazy, type ReactNode } from 'react'
import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AppLayout } from '@/components/layout/app-layout'
import { ProtectedRoute } from '@/components/common/protected-route'
import { RoleGuard } from '@/components/common/role-guard'
import { PublicLayout } from '@/components/layout/public-layout'
import LoginPage from '@/pages/login'
import SignupPage from '@/pages/signup'
import { PortalLayout } from '@/components/layout/portal-layout'
import NotFoundPage from '@/pages/not-found'

const DashboardPage = lazy(() => import('@/pages/dashboard'))
const CustomersPage = lazy(() => import('@/pages/customers'))
const CustomerDetailPage = lazy(() => import('@/pages/customers/detail'))
const CustomerEditPage = lazy(() => import('@/pages/customers/edit'))
const DevicesPage = lazy(() => import('@/pages/devices'))
const DeviceDetailPage = lazy(() => import('@/pages/devices/detail'))
const DeviceEditPage = lazy(() => import('@/pages/devices/edit'))
const RepairsPage = lazy(() => import('@/pages/repairs'))
const RepairDetailPage = lazy(() => import('@/pages/repairs/detail'))
const RepairEditPage = lazy(() => import('@/pages/repairs/edit'))
const ProductsPage = lazy(() => import('@/pages/products'))
const ProductDetailPage = lazy(() => import('@/pages/products/detail'))
const ProductEditPage = lazy(() => import('@/pages/products/edit'))
const CategoriesPage = lazy(() => import('@/pages/categories'))
const SuppliersPage = lazy(() => import('@/pages/suppliers'))
const SupplierDetailPage = lazy(() => import('@/pages/suppliers/detail'))
const SupplierEditPage = lazy(() => import('@/pages/suppliers/edit'))
const InventoryPage = lazy(() => import('@/pages/inventory'))
const InventoryMovementsPage = lazy(() => import('@/pages/inventory/movements'))
const LowStockPage = lazy(() => import('@/pages/inventory/low-stock'))
const SalesPage = lazy(() => import('@/pages/sales'))
const SaleDetailPage = lazy(() => import('@/pages/sales/detail'))
const NewSalePage = lazy(() => import('@/pages/sales/new'))
const PosPage = lazy(() => import('@/pages/pos'))
const PaymentsPage = lazy(() => import('@/pages/payments'))
const InvoicesPage = lazy(() => import('@/pages/invoices'))
const InvoiceDetailPage = lazy(() => import('@/pages/invoices/detail'))
const NotificationsPage = lazy(() => import('@/pages/notifications'))
const ReportsPage = lazy(() => import('@/pages/reports'))
const AuditLogsPage = lazy(() => import('@/pages/audit-logs'))
const SettingsPage = lazy(() => import('@/pages/settings'))
const PublicTrackingPage = lazy(() => import('@/pages/track'))
const ContentPage = lazy(() => import('@/pages/content'))
const RoboticsPage = lazy(() => import('@/pages/robotics'))
const EmployeesPage = lazy(() => import('@/pages/employees'))
const PortalDashboard = lazy(() => import('@/pages/portal/dashboard'))
const PortalProfile = lazy(() => import('@/pages/portal/profile'))
const PortalOrders = lazy(() => import('@/pages/portal/orders'))
const PortalRepairs = lazy(() => import('@/pages/portal/repairs'))
const PortalInvoices = lazy(() => import('@/pages/portal/invoices'))
const PublicHomePage = lazy(() => import('@/pages/public/home'))
const PublicShopPage = lazy(() => import('@/pages/public/shop'))
const PublicProductDetailPage = lazy(() => import('@/pages/public/product-detail'))

function PageSuspense({ children: _children }: { children?: ReactNode }) {
  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  )
}

function lazyElement(element: ReactNode) {
  return <Suspense fallback={<PageSuspense children={undefined} />}>{element}</Suspense>
}

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/signup',
    element: <SignupPage />,
  },
  {
    path: '/track',
    element: lazyElement(<PublicTrackingPage />),
  },
  {
    path: '/',
    element: <PublicLayout />,
    children: [
      { index: true, element: lazyElement(<PublicHomePage />) },
      { path: 'shop', element: lazyElement(<PublicShopPage />) },
      { path: 'product/:id', element: lazyElement(<PublicProductDetailPage productId="" />) },
    ],
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
      { path: 'dashboard', element: lazyElement(<DashboardPage />) },
      {
        path: 'customers',
        element: (
          <RoleGuard allowedRoles={['admin', 'manager', 'sales', 'technician']}>
            {lazyElement(<CustomersPage />)}
          </RoleGuard>
        ),
      },
      {
        path: 'customers/new',
        element: (
          <RoleGuard allowedRoles={['admin', 'manager', 'sales', 'technician']}>
            {lazyElement(<CustomerEditPage />)}
          </RoleGuard>
        ),
      },
      {
        path: 'customers/:id',
        element: (
          <RoleGuard allowedRoles={['admin', 'manager', 'sales', 'technician']}>
            {lazyElement(<CustomerDetailPage />)}
          </RoleGuard>
        ),
      },
      {
        path: 'customers/:id/edit',
        element: (
          <RoleGuard allowedRoles={['admin', 'manager', 'sales', 'technician']}>
            {lazyElement(<CustomerEditPage />)}
          </RoleGuard>
        ),
      },
      {
        path: 'devices',
        element: (
          <RoleGuard allowedRoles={['admin', 'manager', 'sales', 'technician']}>
            {lazyElement(<DevicesPage />)}
          </RoleGuard>
        ),
      },
      {
        path: 'devices/new',
        element: (
          <RoleGuard allowedRoles={['admin', 'manager', 'sales', 'technician']}>
            {lazyElement(<DeviceEditPage />)}
          </RoleGuard>
        ),
      },
      {
        path: 'devices/:id',
        element: (
          <RoleGuard allowedRoles={['admin', 'manager', 'sales', 'technician']}>
            {lazyElement(<DeviceDetailPage />)}
          </RoleGuard>
        ),
      },
      {
        path: 'devices/:id/edit',
        element: (
          <RoleGuard allowedRoles={['admin', 'manager', 'sales', 'technician']}>
            {lazyElement(<DeviceEditPage />)}
          </RoleGuard>
        ),
      },
      {
        path: 'repairs',
        element: (
          <RoleGuard allowedRoles={['admin', 'manager', 'technician']}>
            {lazyElement(<RepairsPage />)}
          </RoleGuard>
        ),
      },
      {
        path: 'repairs/new',
        element: (
          <RoleGuard allowedRoles={['admin', 'manager', 'technician']}>
            {lazyElement(<RepairEditPage />)}
          </RoleGuard>
        ),
      },
      {
        path: 'repairs/:id',
        element: (
          <RoleGuard allowedRoles={['admin', 'manager', 'technician']}>
            {lazyElement(<RepairDetailPage />)}
          </RoleGuard>
        ),
      },
      {
        path: 'repairs/:id/edit',
        element: (
          <RoleGuard allowedRoles={['admin', 'manager', 'technician']}>
            {lazyElement(<RepairEditPage />)}
          </RoleGuard>
        ),
      },
      {
        path: 'products',
        element: (
          <RoleGuard allowedRoles={['admin', 'manager', 'sales', 'technician']}>
            {lazyElement(<ProductsPage />)}
          </RoleGuard>
        ),
      },
      {
        path: 'products/new',
        element: (
          <RoleGuard allowedRoles={['admin', 'manager', 'sales', 'technician']}>
            {lazyElement(<ProductEditPage />)}
          </RoleGuard>
        ),
      },
      {
        path: 'products/:id',
        element: (
          <RoleGuard allowedRoles={['admin', 'manager', 'sales', 'technician']}>
            {lazyElement(<ProductDetailPage />)}
          </RoleGuard>
        ),
      },
      {
        path: 'products/:id/edit',
        element: (
          <RoleGuard allowedRoles={['admin', 'manager', 'sales', 'technician']}>
            {lazyElement(<ProductEditPage />)}
          </RoleGuard>
        ),
      },
      {
        path: 'categories',
        element: (
          <RoleGuard allowedRoles={['admin', 'manager']}>
            {lazyElement(<CategoriesPage />)}
          </RoleGuard>
        ),
      },
      {
        path: 'suppliers',
        element: (
          <RoleGuard allowedRoles={['admin', 'manager']}>
            {lazyElement(<SuppliersPage />)}
          </RoleGuard>
        ),
      },
      {
        path: 'suppliers/new',
        element: (
          <RoleGuard allowedRoles={['admin', 'manager']}>
            {lazyElement(<SupplierEditPage />)}
          </RoleGuard>
        ),
      },
      {
        path: 'suppliers/:id',
        element: (
          <RoleGuard allowedRoles={['admin', 'manager']}>
            {lazyElement(<SupplierDetailPage />)}
          </RoleGuard>
        ),
      },
      {
        path: 'suppliers/:id/edit',
        element: (
          <RoleGuard allowedRoles={['admin', 'manager']}>
            {lazyElement(<SupplierEditPage />)}
          </RoleGuard>
        ),
      },
      {
        path: 'inventory',
        element: (
          <RoleGuard allowedRoles={['admin', 'manager']}>
            {lazyElement(<InventoryPage />)}
          </RoleGuard>
        ),
      },
      {
        path: 'inventory/movements',
        element: (
          <RoleGuard allowedRoles={['admin', 'manager']}>
            {lazyElement(<InventoryMovementsPage />)}
          </RoleGuard>
        ),
      },
      {
        path: 'inventory/low-stock',
        element: (
          <RoleGuard allowedRoles={['admin', 'manager']}>
            {lazyElement(<LowStockPage />)}
          </RoleGuard>
        ),
      },
      {
        path: 'sales',
        element: (
          <RoleGuard allowedRoles={['admin', 'manager', 'sales']}>
            {lazyElement(<SalesPage />)}
          </RoleGuard>
        ),
      },
      {
        path: 'sales/new',
        element: (
          <RoleGuard allowedRoles={['admin', 'manager', 'sales']}>
            {lazyElement(<NewSalePage />)}
          </RoleGuard>
        ),
      },
      {
        path: 'sales/:id',
        element: (
          <RoleGuard allowedRoles={['admin', 'manager', 'sales']}>
            {lazyElement(<SaleDetailPage />)}
          </RoleGuard>
        ),
      },
      {
        path: 'pos',
        element: (
          <RoleGuard allowedRoles={['admin', 'manager', 'sales']}>
            {lazyElement(<PosPage />)}
          </RoleGuard>
        ),
      },
      {
        path: 'payments',
        element: (
          <RoleGuard allowedRoles={['admin', 'manager', 'sales']}>
            {lazyElement(<PaymentsPage />)}
          </RoleGuard>
        ),
      },
      {
        path: 'portal',
        element: lazyElement(<PortalLayout />),
        children: [
          { index: true, element: <PortalDashboard /> },
          { path: 'profile', element: <PortalProfile /> },
          { path: 'orders', element: <PortalOrders /> },
          { path: 'repairs', element: <PortalRepairs /> },
          { path: 'invoices', element: <PortalInvoices /> },
        ],
      },
      {
        path: 'invoices',
        element: (
          <RoleGuard allowedRoles={['admin', 'manager', 'sales']}>
            {lazyElement(<InvoicesPage />)}
          </RoleGuard>
        ),
      },
      {
        path: 'invoices/:id',
        element: (
          <RoleGuard allowedRoles={['admin', 'manager', 'sales']}>
            {lazyElement(<InvoiceDetailPage />)}
          </RoleGuard>
        ),
      },
      {
        path: 'notifications',
        element: (
          <RoleGuard allowedRoles={['admin', 'manager', 'technician', 'sales']}>
            {lazyElement(<NotificationsPage />)}
          </RoleGuard>
        ),
      },
      {
        path: 'reports',
        element: (
          <RoleGuard allowedRoles={['admin', 'manager']}>
            {lazyElement(<ReportsPage />)}
          </RoleGuard>
        ),
      },
      {
        path: 'audit-logs',
        element: (
          <RoleGuard allowedRoles={['admin', 'manager']}>
            {lazyElement(<AuditLogsPage />)}
          </RoleGuard>
        ),
      },
      { path: 'settings', element: lazyElement(<SettingsPage />) },
      { path: 'content', element: lazyElement(<ContentPage />) },
      { path: 'robotics', element: lazyElement(<RoboticsPage />) },
      {
        path: 'employees',
        element: (
          <RoleGuard allowedRoles={['admin']}>
            {lazyElement(<EmployeesPage />)}
          </RoleGuard>
        ),
      },
    ],
  },
  { path: '*', element: <NotFoundPage /> },
])
