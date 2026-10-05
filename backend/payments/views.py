"""Payment endpoint.

Only staff may trigger a capture, because ``PaymentService.capture`` stands in
for a real provider charge. In production this route is replaced by the
provider's webhook handler; the service call stays the same.
"""

from __future__ import annotations

from django.shortcuts import get_object_or_404
from drf_spectacular.utils import extend_schema
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from common.constants import PaymentStatus
from common.exceptions import ResourceConflictError
from common.permissions import IsAdmin
from orders.models import Order
from orders.serializers import OrderSerializer
from payments.services import PaymentError, PaymentService


class OrderPaymentCaptureView(APIView):
    """Record a successful payment against an order (sandbox for the MVP)."""

    permission_classes = [IsAuthenticated, IsAdmin]

    @extend_schema(
        tags=["admin"],
        summary="Mark an order as paid",
        description=(
            "Sandbox capture standing in for a real payment gateway. Flips "
            "`payment_status` to `paid`. Staff only; a production deployment "
            "replaces this with the provider's webhook handler."
        ),
        request=None,
        responses={200: OrderSerializer},
    )
    def post(self, request, order_id, *args, **kwargs) -> Response:
        order = get_object_or_404(Order.objects.all(), pk=order_id)

        # `PaymentService.mark_paid` is idempotent so a gateway webhook can be
        # retried safely, but a human-initiated capture should say so plainly.
        if order.payment_status == PaymentStatus.PAID:
            raise ResourceConflictError(
                "This order has already been paid.", code="already_paid"
            )

        try:
            order = PaymentService.capture(order)
        except PaymentError as exc:
            raise ResourceConflictError(exc.message, code=exc.code) from None

        order = Order.objects.select_related("user").prefetch_related("items").get(pk=order.pk)
        return Response(OrderSerializer(order, context={"request": request}).data)
