import type { OrderStatus, PaymentStatus, UserRole } from '@/types'
import {
  ORDER_STATUS_META,
  PAYMENT_STATUS_META,
  ROLE_META,
} from '@/utils/constants'
import { Badge } from './Display'
import { StatusDot } from './Feedback'

/**
 * Status pills.
 *
 * Colour and copy are derived from a single metadata map so a status looks and
 * reads the same on the storefront, in order history and in the admin console.
 */

export function OrderStatusBadge({ status, className }: { status: OrderStatus; className?: string }) {
  const meta = ORDER_STATUS_META[status] ?? ORDER_STATUS_META.pending
  return (
    <Badge className={className}>
      <StatusDot className={meta.dot} />
      {meta.label}
    </Badge>
  )
}

export function PaymentStatusBadge({
  status,
  className,
}: {
  status: PaymentStatus
  className?: string
}) {
  const meta = PAYMENT_STATUS_META[status] ?? PAYMENT_STATUS_META.pending
  return (
    <Badge className={className}>
      <StatusDot className={meta.dot} />
      {meta.label}
    </Badge>
  )
}

export function RoleBadge({ role, className }: { role: UserRole; className?: string }) {
  const meta = ROLE_META[role] ?? ROLE_META.customer
  return (
    <Badge className={className ?? meta.className}>{meta.label}</Badge>
  )
}
