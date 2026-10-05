"""Staff-only order endpoints (``/api/admin/orders/``)."""

from __future__ import annotations

from django_filters import rest_framework as filters
from drf_spectacular.utils import extend_schema
from rest_framework import mixins, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from common.constants import OrderStatus, PaymentStatus
from common.permissions import IsAdmin
from orders.models import Order
from orders.serializers import OrderSerializer, OrderStatusUpdateSerializer
from orders.services import OrderService


class AdminOrderFilterSet(filters.FilterSet):
    status = filters.ChoiceFilter(choices=OrderStatus.choices)
    payment_status = filters.ChoiceFilter(choices=PaymentStatus.choices)
    # `orders.user_id` is a uuid (profiles.id), so this must not be a number filter.
    user = filters.UUIDFilter(field_name="user_id")
    created_after = filters.DateTimeFilter(field_name="created_at", lookup_expr="gte")
    created_before = filters.DateTimeFilter(field_name="created_at", lookup_expr="lt")
    search = filters.CharFilter(method="filter_search")

    class Meta:
        model = Order
        fields = ["status", "payment_status", "user"]

    def filter_search(self, queryset, name, value):
        from django.db.models import Q

        return queryset.filter(
            Q(order_number__icontains=value)
            | Q(user__email__icontains=value)
            | Q(user__full_name__icontains=value)
        )


class AdminOrderViewSet(mixins.ListModelMixin, mixins.RetrieveModelMixin, viewsets.GenericViewSet):
    """Every order, with the status transition endpoint staff need."""

    queryset = (
        Order.objects.select_related("user").prefetch_related("items").order_by("-created_at")
    )
    serializer_class = OrderSerializer
    permission_classes = [IsAdmin]
    filterset_class = AdminOrderFilterSet
    ordering_fields = ("created_at", "total", "status")
    ordering = ("-created_at",)

    @extend_schema(
        tags=["admin"],
        summary="List all orders",
        description="Filter by status, payment status, customer or date range.",
        responses={200: OrderSerializer(many=True)},
    )
    def list(self, request, *args, **kwargs) -> Response:
        return super().list(request, *args, **kwargs)

    @extend_schema(
        tags=["admin"],
        summary="Update an order status",
        description=(
            "Moves the order along the fulfilment state machine. Illegal transitions "
            "(for example `delivered` -> `pending`) return 400 and list the allowed "
            "targets."
        ),
        request=OrderStatusUpdateSerializer,
        responses={200: OrderSerializer},
    )
    @action(detail=True, methods=["patch"], url_path="status")
    def update_status(self, request, *args, **kwargs) -> Response:
        order = self.get_object()
        payload = OrderStatusUpdateSerializer(data=request.data)
        payload.is_valid(raise_exception=True)

        updated = OrderService.transition(
            order,
            payload.validated_data["status"],
            payment_status=payload.validated_data.get("payment_status"),
        )
        updated = self.get_queryset().get(pk=updated.pk)
        return Response(self.get_serializer(updated).data)

    @extend_schema(
        tags=["admin"],
        summary="Cancel an order",
        description="Staff forced cancellation. Returns reserved stock to inventory.",
        request=None,
        responses={200: OrderSerializer},
    )
    @action(detail=True, methods=["post"])
    def cancel(self, request, *args, **kwargs) -> Response:
        order = self.get_object()
        cancelled = OrderService.cancel(order)
        cancelled = self.get_queryset().get(pk=cancelled.pk)
        return Response(self.get_serializer(cancelled).data)