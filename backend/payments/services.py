"""Payment integration seam.

``public.orders.payment_status`` is the only payment state this schema stores -
there is no ``payments`` table - so this module is deliberately model-free.

It exists to hold one responsibility: applying a payment outcome to an order
without the calling code having to know the rules. Swapping the sandbox
``mark_paid`` call for a real PSP means replacing :meth:`PaymentService.capture`
with the provider SDK plus a webhook, and nothing else moves.
"""

from __future__ import annotations

import logging

from django.db import transaction
from django.utils import timezone

from common.constants import OrderStatus, PaymentStatus
from orders.models import Order

logger = logging.getLogger("startstore.payments")


class PaymentError(Exception):
    """A payment cannot move to the requested state."""

    def __init__(self, message: str, *, code: str = "payment_error"):
        super().__init__(message)
        self.message = message
        self.code = code


class PaymentService:
    """Applies payment outcomes to an order."""

    @staticmethod
    @transaction.atomic
    def mark_paid(order: Order, *, provider_reference: str = "") -> Order:
        """Record a successful capture. Idempotent."""
        order = Order.objects.select_for_update().get(pk=order.pk)

        if order.payment_status == PaymentStatus.PAID:
            return order
        # Check the most specific reason first: a cancelled *and* refunded order
        # should report the refund, which is the actionable fact.
        if order.payment_status == PaymentStatus.REFUNDED:
            raise PaymentError(
                "This order has been refunded and cannot be captured again.",
                code="already_refunded",
            )
        if order.status == OrderStatus.CANCELLED:
            raise PaymentError(
                "A cancelled order cannot be paid.", code="order_cancelled"
            )

        order.payment_status = PaymentStatus.PAID
        order.updated_at = timezone.now()
        order.save(update_fields=["payment_status", "updated_at"])
        if provider_reference:
            logger.info("Order %s captured (ref=%s)", order.order_number, provider_reference)
        return order

    @staticmethod
    @transaction.atomic
    def mark_failed(order: Order, *, reason: str = "") -> Order:
        """Record a failed attempt. Only a still-pending order may fail."""
        order = Order.objects.select_for_update().get(pk=order.pk)

        if order.payment_status == PaymentStatus.PAID:
            raise PaymentError(
                "A captured payment cannot be marked as failed.", code="already_paid"
            )

        order.payment_status = PaymentStatus.FAILED
        order.updated_at = timezone.now()
        order.save(update_fields=["payment_status", "updated_at"])
        if reason:
            logger.info("Order %s payment failed: %s", order.order_number, reason)
        return order

    @staticmethod
    @transaction.atomic
    def mark_refunded(order: Order) -> Order:
        """Reverse a capture. Idempotent."""
        order = Order.objects.select_for_update().get(pk=order.pk)

        if order.payment_status != PaymentStatus.PAID:
            raise PaymentError(
                "Only a captured order can be refunded.", code="not_paid"
            )

        order.payment_status = PaymentStatus.REFUNDED
        order.updated_at = timezone.now()
        order.save(update_fields=["payment_status", "updated_at"])
        return order

    @staticmethod
    def capture(order: Order) -> Order:
        """Sandbox capture used by the MVP in place of a real gateway.

        Replace this method with the provider SDK call. Everything downstream
        already goes through :meth:`mark_paid`.
        """
        return PaymentService.mark_paid(order, provider_reference=f"sandbox-{order.order_number}")
