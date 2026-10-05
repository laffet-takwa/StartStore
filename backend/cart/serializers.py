"""Cart serializers."""

from __future__ import annotations

from django.conf import settings
from rest_framework import serializers

from cart.models import Cart, CartItem
from orders.services import ShippingService
from products.models import Product
from products.serializers import ProductSummarySerializer


class CartItemSerializer(serializers.ModelSerializer):
    """A cart line.

    Reads expose the nested product snapshot plus the server-computed money
    fields. Writes accept only ``product_id`` and ``quantity`` - a client can
    never state what a line costs.
    """

    product = ProductSummarySerializer(read_only=True)
    product_id = serializers.PrimaryKeyRelatedField(
        queryset=Product.objects.all(),
        source="product",
        write_only=True,
        help_text="Product to add. Required on create.",
    )
    unit_price = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    line_total = serializers.DecimalField(max_digits=14, decimal_places=2, read_only=True)
    is_available = serializers.BooleanField(read_only=True)
    available_quantity = serializers.IntegerField(read_only=True)

    class Meta:
        model = CartItem
        fields = (
            "id",
            "product",
            "product_id",
            "quantity",
            "unit_price",
            "line_total",
            "is_available",
            "available_quantity",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "created_at", "updated_at")
        extra_kwargs = {"quantity": {"min_value": 1, "max_value": 999}}

    def validate_quantity(self, value: int) -> int:
        if value < 1:
            raise serializers.ValidationError("Quantity must be greater than 0.")
        return value


class CartItemUpdateSerializer(serializers.Serializer):
    """PATCH payload for an existing cart line."""

    quantity = serializers.IntegerField(min_value=1, max_value=999)


class CartSerializer(serializers.ModelSerializer):
    """The authenticated customer's cart with server-computed totals.

    ``subtotal`` is summed from current catalogue prices and the shipping
    figures come from :class:`orders.services.ShippingService`, so the basket
    screen shows exactly what checkout will charge.
    """

    items = CartItemSerializer(many=True, read_only=True)
    total_items = serializers.IntegerField(read_only=True)
    subtotal = serializers.DecimalField(max_digits=14, decimal_places=2, read_only=True)
    shipping_cost = serializers.SerializerMethodField()
    total = serializers.SerializerMethodField()
    free_shipping_threshold = serializers.SerializerMethodField()
    currency = serializers.SerializerMethodField()

    class Meta:
        model = Cart
        fields = (
            "id",
            "items",
            "total_items",
            "subtotal",
            "shipping_cost",
            "total",
            "free_shipping_threshold",
            "currency",
            "created_at",
            "updated_at",
        )
        read_only_fields = fields

    def get_shipping_cost(self, cart: Cart) -> str:
        return f"{ShippingService.cost_for(cart.subtotal):.2f}"

    def get_total(self, cart: Cart) -> str:
        return f"{cart.subtotal + ShippingService.cost_for(cart.subtotal):.2f}"

    def get_free_shipping_threshold(self, cart: Cart) -> str:
        return f"{float(settings.STARTSTORE_FREE_SHIPPING_THRESHOLD or 0):.2f}"

    def get_currency(self, cart: Cart) -> str:
        # Presentation only: orders store bare decimals with no currency column.
        return settings.STARTSTORE_CURRENCY