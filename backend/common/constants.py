"""Domain wide enumerations and the state machines built on top of them."""

from __future__ import annotations

from django.db import models


class OrderStatus(models.TextChoices):
    PENDING = "pending", "Pending"
    CONFIRMED = "confirmed", "Confirmed"
    PROCESSING = "processing", "Processing"
    SHIPPED = "shipped", "Shipped"
    DELIVERED = "delivered", "Delivered"
    CANCELLED = "cancelled", "Cancelled"


class PaymentStatus(models.TextChoices):
    PENDING = "pending", "Pending"
    PAID = "paid", "Paid"
    FAILED = "failed", "Failed"
    REFUNDED = "refunded", "Refunded"


#: Statuses a customer is still allowed to cancel from.
CANCELLABLE_ORDER_STATUSES: frozenset[str] = frozenset(
    {
        OrderStatus.PENDING,
        OrderStatus.CONFIRMED,
        OrderStatus.PROCESSING,
    }
)

#: Allowed order status transitions. Admin status updates are validated against
#: this graph so an order can never travel backwards or skip fulfilment.
ORDER_STATUS_TRANSITIONS: dict[str, frozenset[str]] = {
    OrderStatus.PENDING: frozenset(
        {OrderStatus.CONFIRMED, OrderStatus.PROCESSING, OrderStatus.CANCELLED}
    ),
    OrderStatus.CONFIRMED: frozenset(
        {OrderStatus.PROCESSING, OrderStatus.SHIPPED, OrderStatus.CANCELLED}
    ),
    OrderStatus.PROCESSING: frozenset({OrderStatus.SHIPPED, OrderStatus.CANCELLED}),
    OrderStatus.SHIPPED: frozenset({OrderStatus.DELIVERED}),
    OrderStatus.DELIVERED: frozenset(),
    OrderStatus.CANCELLED: frozenset(),
}

#: Statuses whose inventory has already been deducted by checkout and therefore
#: must be returned to stock when the order is cancelled.
RESTOCK_ON_CANCEL_STATUSES: frozenset[str] = frozenset(
    {
        OrderStatus.PENDING,
        OrderStatus.CONFIRMED,
        OrderStatus.PROCESSING,
    }
)


def can_transition(current: str, target: str) -> bool:
    """Return whether ``current -> target`` is a legal order transition."""
    return target in ORDER_STATUS_TRANSITIONS.get(current, frozenset())