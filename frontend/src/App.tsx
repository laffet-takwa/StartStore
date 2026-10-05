import { Suspense, lazy, useEffect } from 'react'
import { Route, Routes } from 'react-router-dom'

import {
  AdminRoute,
  CustomerRoute,
  GuestRoute,
  ProtectedRoute,
} from '@/components/auth/RouteGuards'
import { PageLoader } from '@/components/common/Feedback'
import { useAuth } from '@/hooks/useAuth'
import { AdminLayout } from '@/layouts/AdminLayout'
import { AuthLayout } from '@/layouts/AuthLayout'
import { PublicLayout } from '@/layouts/PublicLayout'
import { bindSessionExpiry } from '@/store/authStore'
import { ROUTES } from '@/utils/constants'

/**
 * Every page is code-split, so a first-time visitor downloads the home page and
 * the shared shell only. The admin console in particular is never fetched by a
 * shopper.
 */
const HomePage = lazy(() => import('@/pages/HomePage'))
const ProductsPage = lazy(() => import('@/pages/ProductsPage'))
const ProductDetailPage = lazy(() => import('@/pages/ProductDetailPage'))
const CategoriesPage = lazy(() => import('@/pages/CategoriesPage'))
const SearchResultsPage = lazy(() => import('@/pages/SearchResultsPage'))
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'))

const LoginPage = lazy(() => import('@/pages/LoginPage'))
const RegisterPage = lazy(() => import('@/pages/RegisterPage'))

const CartPage = lazy(() => import('@/pages/CartPage'))
const WishlistPage = lazy(() => import('@/pages/WishlistPage'))
const CheckoutPage = lazy(() => import('@/pages/CheckoutPage'))
const OrderSuccessPage = lazy(() => import('@/pages/OrderSuccessPage'))
const OrdersPage = lazy(() => import('@/pages/OrdersPage'))
const OrderDetailPage = lazy(() => import('@/pages/OrderDetailPage'))
const ProfilePage = lazy(() => import('@/pages/ProfilePage'))
const AddressesPage = lazy(() => import('@/pages/AddressesPage'))

const AdminDashboardPage = lazy(() => import('@/pages/admin/AdminDashboardPage'))
const AdminProductsPage = lazy(() => import('@/pages/admin/AdminProductsPage'))
const AdminProductCreatePage = lazy(() => import('@/pages/admin/AdminProductCreatePage'))
const AdminProductEditPage = lazy(() => import('@/pages/admin/AdminProductEditPage'))
const AdminCategoriesPage = lazy(() => import('@/pages/admin/AdminCategoriesPage'))
const AdminOrdersPage = lazy(() => import('@/pages/admin/AdminOrdersPage'))
const AdminUsersPage = lazy(() => import('@/pages/admin/AdminUsersPage'))

export default function App() {
  const { hydrate, isResolving } = useAuth()

  useEffect(() => {
    // Confirm the stored session against the API, and react if it is revoked
    // mid-session (an exhausted refresh token clears the session).
    void hydrate()
    return bindSessionExpiry()
  }, [hydrate])

  // Holding the first paint until the session is known prevents a flash of the
  // signed-out UI on every reload.
  if (isResolving) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <PageLoader label="Loading StartStore" />
      </div>
    )
  }

  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* --- Auth (own shell, no storefront chrome) ------------------------ */}
        <Route
          element={
            <GuestRoute>
              <AuthLayout />
            </GuestRoute>
          }
        >
          <Route path={ROUTES.login} element={<LoginPage />} />
          <Route path={ROUTES.register} element={<RegisterPage />} />
        </Route>

        {/* --- Storefront ---------------------------------------------------- */}
        <Route element={<PublicLayout />}>
          <Route path={ROUTES.home} element={<HomePage />} />
          <Route path={ROUTES.products} element={<ProductsPage />} />
          <Route path="/products/:productId" element={<ProductDetailPage />} />
          <Route path={ROUTES.categories} element={<CategoriesPage />} />
          <Route path={ROUTES.search} element={<SearchResultsPage />} />

          {/* Customer */}
          <Route
            path={ROUTES.cart}
            element={
              <ProtectedRoute>
                <CartPage />
              </ProtectedRoute>
            }
          />
          <Route
            path={ROUTES.wishlist}
            element={
              <ProtectedRoute>
                <WishlistPage />
              </ProtectedRoute>
            }
          />
          <Route
            path={ROUTES.checkout}
            element={
              <CustomerRoute>
                <CheckoutPage />
              </CustomerRoute>
            }
          />
          <Route
            path="/orders/:orderId/success"
            element={
              <ProtectedRoute>
                <OrderSuccessPage />
              </ProtectedRoute>
            }
          />
          <Route
            path={ROUTES.orders}
            element={
              <ProtectedRoute>
                <OrdersPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/orders/:orderId"
            element={
              <ProtectedRoute>
                <OrderDetailPage />
              </ProtectedRoute>
            }
          />
          <Route
            path={ROUTES.profile}
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />
          <Route
            path={ROUTES.addresses}
            element={
              <ProtectedRoute>
                <AddressesPage />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<NotFoundPage />} />
        </Route>

        {/* --- Admin ---------------------------------------------------------- */}
        <Route
          element={
            <AdminRoute>
              <AdminLayout />
            </AdminRoute>
          }
        >
          <Route path={ROUTES.admin.root} element={<AdminDashboardPage />} />
          <Route path="admin/products" element={<AdminProductsPage />} />
          <Route path="admin/products/new" element={<AdminProductCreatePage />} />
          <Route path="admin/products/:productId" element={<AdminProductEditPage />} />
          <Route path="admin/categories" element={<AdminCategoriesPage />} />
          <Route path="admin/orders" element={<AdminOrdersPage />} />
          <Route path="admin/users" element={<AdminUsersPage />} />
        </Route>
      </Routes>
    </Suspense>
  )
}
