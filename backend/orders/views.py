"""Customer order endpoints."""

from __future__ import annotations

from django_filters import rest_framework as filters
from drf_spectacular.utils import OpenApiExample, extend_schema
from rest_framework import mixins, status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from accounts.services import resolve_shipping_address
from common.constants import OrderStatus, PaymentStatus
from common.permissions import IsCustomer, IsOwner
from orders.exceptions import OrderNotFoundError
from orders.models import Order
from orders.serializers import (
    OrderCreateSerializer,
    OrderListSerializer,
    OrderSerializer,
    OrderStatusUpdateSerializer,
)
from orders.services import CheckoutService, OrderService


class OrderFilterSet(filters.FilterSet):
    status = filters.ChoiceFilter(choices=OrderStatus.choices)
    payment_status = filters.ChoiceFilter(choices=PaymentStatus.choices)
    created_after = filters.DateTimeFilter(field_name="created_at", lookup_expr="gte")
    created_before = filters.DateTimeFilter(field_name="created_at", lookup_expr="lt")
    search = filters.CharFilter(method="filter_search")

    class Meta:
        model = Order
        fields = ["status", "payment_status"]

    def filter_search(self, queryset, name, value):
        return queryset.filter(order_number__icontains=value)


class OrderViewSet(
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    mixins.CreateModelMixin,
    viewsets.GenericViewSet,
):
    """Checkout and order history for the authenticated customer.

    ``IsCustomer`` keeps staff accounts out of the storefront flow: an admin
    orders on behalf of someone else through the admin API, not by checking out
    under their own account.

    ``get_queryset`` is scoped to ``request.user``, which is the primary
    ownership control: another customer's order id yields 404 rather than 403,
    so the API never confirms that an id exists. ``IsOwner`` is layered on top
    as a second, explicit check on detail routes.
    """

    permission_classes = [IsAuthenticated, IsCustomer, IsOwner]
    queryset = Order.objects.all()
    filterset_class = OrderFilterSet
    ordering_fields = ("created_at", "total", "status")
    ordering = ("-created_at",)
    http_method_names = ["get", "post", "patch", "head", "options"]

    def get_queryset(self):
        return (
            Order.objects.filter(user=self.request.user)
            .select_related("user")
            .prefetch_related("items")
        )

    def get_serializer_class(self):
        if self.action == "create":
            return OrderCreateSerializer
        if self.action == "list":
            return OrderListSerializer
        return OrderSerializer

    def get_object(self):
        order = super().get_object()
        if order.user_id != self.request.user.id:  # defensive, queryset is scoped
            raise OrderNotFoundError()
        return order

    @extend_schema(
        tags=["orders"],
        summary="List my orders",
        responses={200: OrderListSerializer(many=True)},
    )
    def list(self, request, *args, **kwargs) -> Response:
        return super().list(request, *args, **kwargs)

    @extend_schema(
        tags=["orders"],
        summary="Get one of my orders",
        responses={200: OrderSerializer},
    )
    def retrieve(self, request, *args, **kwargs) -> Response:
        return super().retrieve(request, *args, **kwargs)

    @extend_schema(
        tags=["orders"],
        summary="Check out",
        description=(
            "Converts the authenticated customer's cart into an order. Provide either "
            "`address_id` (a saved address) or an inline `shipping_address`. The "
            "subtotal, shipping cost and total are recomputed on the server - any "
            "price in the request body is ignored. Rejected with 400 when the cart is "
            "empty, a product was deactivated, or stock is insufficient. On success "
            "the cart is emptied and stock is decremented atomically."
        ),
request=OrderCreateSerializer,
        responses={201: OrderSerializer},
        examples=[
            OpenApiExample(
                "Saved address",
                value={
                    "shipping_address_id": "4365885e-2f06-40da-86cb-d0ece19b4515",
                    "payment_method": "card",
                },
                request_only=True,
            ),
            OpenApiExample(
                "Inline address",
                value={
                    "shipping_address": {
                        "full_name": "Ada Lovelace",
                        "phone": "+15551234567",
                        "address_line": "1 Analytical Engine Way",
                        "city": "London",
                        "postal_code": "EC1A 1BB",
                        "country": "GB",
                    },
                    "payment_method": "pay_on_delivery",
                },
                request_only=True,
            ),
        ],
    )
    def create(self, request, *args, **kwargs) -> Response:
        payload = OrderCreateSerializer(data=request.data)
        payload.is_valid(raise_exception=True)

        shipping_address = resolve_shipping_address(
            user=request.user,
            address_id=payload.validated_data.get("shipping_address_id"),
            inline=payload.validated_data.get("shipping_address"),
        )

        order = CheckoutService.execute(user=request.user, shipping_address=shipping_address)
        order = self.get_queryset().get(pk=order.pk)
        return Response(
            OrderSerializer(order, context=self.get_serializer_context()).data,
            status=status.HTTP_201_CREATED,
        )

    @extend_schema(
        tags=["orders"],
        summary="Cancel one of my orders",
        description=(
            "Allowed while the order is pending, confirmed or processing. Reserved "
            "stock is returned and a paid order is marked refunded."
        ),
        request=None,
        responses={200: OrderSerializer},
    )
    @action(detail=True, methods=["post"])
    def cancel(self, request, *args, **kwargs) -> Response:
        order = self.get_object()
        cancelled = OrderService.cancel(order)
        cancelled = self.get_queryset().get(pk=cancelled.pk)
        return Response(OrderSerializer(cancelled, context=self.get_serializer_context()).data)