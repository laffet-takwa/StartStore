"""Order serializers."""

from __future__ import annotations

from rest_framework import serializers

from accounts.serializers import ShippingAddressSerializer
from common.constants import OrderStatus, PaymentStatus
from orders.models import Order, OrderItem

#: Payment methods the storefront may name. Nothing is persisted (the schema has
#: no such column) but validating them here gives the client immediate feedback.
PAYMENT_METHOD_CHOICES = ("card", "pay_on_delivery")


class OrderItemSerializer(serializers.ModelSerializer):
    """A purchased line. Read only: it is a historical record."""

    product_id = serializers.UUIDField(read_only=True, allow_null=True)
    unit_price = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    subtotal = serializers.DecimalField(max_digits=14, decimal_places=2, read_only=True)

    class Meta:
        model = OrderItem
        fields = (
            "id",
            "product",
            "product_id",
            "product_name",
            "unit_price",
            "quantity",
            "subtotal",
        )
        read_only_fields = fields


class OrderSerializer(serializers.ModelSerializer):
    """Full order representation."""

    user_id = serializers.UUIDField(read_only=True)
    user_email = serializers.EmailField(source="user.email", read_only=True)
    items = OrderItemSerializer(many=True, read_only=True)
    item_count = serializers.IntegerField(read_only=True)
    can_cancel = serializers.BooleanField(read_only=True)
    next_statuses = serializers.ListField(child=serializers.CharField(), read_only=True)
    status_display = serializers.CharField(source="get_status_display", read_only=True)
    payment_status_display = serializers.CharField(
        source="get_payment_status_display", read_only=True
    )

    class Meta:
        model = Order
        fields = (
            "id",
            "order_number",
            "user_id",
            "user_email",
            "status",
            "status_display",
            "payment_status",
            "payment_status_display",
            "subtotal",
            "shipping_cost",
            "total",
            "shipping_address",
            "items",
            "item_count",
            "can_cancel",
            "next_statuses",
            "created_at",
            "updated_at",
        )
        read_only_fields = fields


class OrderListSerializer(OrderSerializer):
    """Trimmed payload for order history screens."""

    class Meta(OrderSerializer.Meta):
        fields = tuple(
            field
            for field in OrderSerializer.Meta.fields
            if field not in {"shipping_address", "items"}
        )
        read_only_fields = fields


class OrderCreateSerializer(serializers.Serializer):
    """Checkout body.

    Exactly one destination is accepted: a saved address id
    (``shipping_address_id``, or its legacy alias ``address_id``) or an inline
    ``shipping_address`` object. Prices, shipping and totals are deliberately
    absent - the server derives every one of them from the cart.

    ``payment_method`` is accepted and validated but not stored: the schema has no
    such column and the MVP records every order as ``awaiting payment`` for a
    staff member or gateway to complete.
    """

    shipping_address_id = serializers.UUIDField(
        required=False,
        allow_null=True,
        help_text="Id of one of your saved addresses.",
    )
    #: Accepted so older clients keep working.
    address_id = serializers.UUIDField(required=False, allow_null=True)
    shipping_address = ShippingAddressSerializer(required=False, allow_null=True)
    payment_method = serializers.ChoiceField(
        choices=PAYMENT_METHOD_CHOICES,
        required=False,
        allow_blank=True,
        default="",
        help_text="Recorded for the client only; the MVP creates the order as pending payment.",
    )

    def validate(self, attrs: dict) -> dict:
        attrs = super().validate(attrs)
        address_id = attrs.get("shipping_address_id") or attrs.get("address_id")
        inline = attrs.get("shipping_address")

        if address_id and inline:
            raise serializers.ValidationError(
                {
                    "shipping_address_id": [
                        "Send either a saved address id or shipping_address, not both."
                    ]
                }
            )
        if not address_id and not inline:
            raise serializers.ValidationError(
                {
                    "shipping_address_id": [
                        "Provide shipping_address_id or shipping_address."
                    ]
                }
            )

        # Collapse the alias so the view has one thing to read.
        attrs["shipping_address_id"] = address_id
        attrs.pop("address_id", None)
        return attrs


class OrderStatusUpdateSerializer(serializers.Serializer):
    """Admin payload for moving an order along its lifecycle."""

    status = serializers.ChoiceField(
        choices=OrderStatus.choices,
        help_text="Target status. Must be reachable from the current status.",
    )
    payment_status = serializers.ChoiceField(
        choices=PaymentStatus.choices, required=False, allow_null=True
    )
    note = serializers.CharField(max_length=255, required=False, allow_blank=True, write_only=True)