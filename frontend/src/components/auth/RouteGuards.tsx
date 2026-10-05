import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'

import { useAuth } from '@/hooks/useAuth'
import { PageLoader } from '@/components/common/Feedback'
import { ROUTES } from '@/utils/constants'

/**
 * Route guards.
 *
 * Two rules the UI enforces, mirroring the API so a user never lands on a page
 * that will immediately 403:
 *  - authenticated routes need a session,
 *  - staff routes additionally need `role === 'admin'`.
 *
 * The API remains the authority; these exist to avoid pointless round-trips and
 * to keep a signed-out visitor out of the account area.
 */

function FullPageLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <PageLoader label="Checking your session" />
    </div>
  )
}

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, isResolving } = useAuth()
  const location = useLocation()

  if (isResolving) return <FullPageLoader />

  if (!isAuthenticated) {
    // Remember where they were headed so login can send them back.
    return <Navigate to={ROUTES.login} state={{ from: location.pathname }} replace />
  }

  return <>{children}</>
}

export function AdminRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, isAdmin, isResolving } = useAuth()
  const location = useLocation()

  if (isResolving) return <FullPageLoader />

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.login} state={{ from: location.pathname }} replace />
  }

  if (!isAdmin) {
    // Signed in but not staff: send them to their account rather than a dead end.
    return <Navigate to={ROUTES.profile} state={{ denied: true }} replace />
  }

  return <>{children}</>
}

/** Keeps signed-in users away from login/register. */
export function GuestRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, isResolving } = useAuth()

  if (isResolving) return <FullPageLoader />
  if (isAuthenticated) return <Navigate to={ROUTES.home} replace />

  return <>{children}</>
}

/**
 * Customer-only flows. Staff order on someone's behalf through the admin API, so
 * the storefront checkout is not for them.
 */
export function CustomerRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, isAdmin, isResolving } = useAuth()
  const location = useLocation()

  if (isResolving) return <FullPageLoader />
  if (!isAuthenticated) {
    return <Navigate to={ROUTES.login} state={{ from: location.pathname }} replace />
  }
  if (isAdmin) return <Navigate to={ROUTES.admin.dashboard} replace />

  return <>{children}</>
}
