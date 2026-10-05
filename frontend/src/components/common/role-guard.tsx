import { Navigate } from 'react-router-dom'
import { useAuth } from '@/context/auth-context'
import type { Role } from '@/types'

export function RoleGuard({
  allowedRoles,
  children,
}: {
  allowedRoles: Role[]
  children: React.ReactNode
}) {
  const { user } = useAuth()

  if (!user || !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}