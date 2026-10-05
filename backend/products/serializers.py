"""Product serializers."""

from __future__ import annotations

from decimal import Decimal

from rest_framework import serializers
from rest_framework.validators import UniqueValidator

from categories.models import Category
from categories.serializers import CategorySerializer
from common.fields import NormalizedSKUField
from common.permissions import is_admin
from common.serializers import ImageUploadFieldsMixin
from common.validators import validate_sku
from products.models import Product, ProductImage
from products.validators import validate_price_rules


class ProductImageSerializer(ImageUploadFieldsMixin, serializers.ModelSerializer):
    """A gallery image. ``product`` comes from the URL, not the body."""

    product_id = serializers.UUIDField(read_only=True)

    class Meta:
        model = ProductImage
        fields = ("id", "product_id", "image_url", "alt_text", "display_order")
        read_only_fields = ("id", "product_id")
        extra_kwargs = {
            "image_url": {"required": True, "allow_blank": False},
            "alt_text": {"required": False, "allow_blank": True, "allow_null": True},
            "display_order": {"required": False, "min_value": 0},
        }

    image_prefix = "products/images"

    def validate_alt_text(self, value):
        return value.strip() if value else None


class ProductSummarySerializer(serializers.ModelSerializer):
    """Compact product shape for dashboards, admin lists and order previews."""

    category_name = serializers.CharField(source="category.name", read_only=True, default=None)
    final_price = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    in_stock = serializers.BooleanField(read_only=True)

    class Meta:
        model = Product
        fields = (
            "id",
            "name",
            "slug",
            "sku",
            "category",
            "category_name",
            "price",
            "discount_price",
            "final_price",
            "stock",
            "in_stock",
            "image_url",
            "is_active",
        )
        read_only_fields = fields


class ProductSerializer(ImageUploadFieldsMixin, serializers.ModelSerializer):
    """Full catalogue representation, used for both list and detail responses.

    Foreign keys follow one convention across the API: **read nested, write by
    id**. ``category`` is the nested object on the way out; ``category_id`` is
    the accepted input key, and it may be omitted because the column is nullable.
    Prices are server owned - no field a client can send changes what a product
    costs at checkout.
    """

    category = CategorySerializer(read_only=True)
    category_id = serializers.PrimaryKeyRelatedField(
        queryset=Category.objects.all(),
        source="category",
        write_only=True,
        required=False,
        allow_null=True,
        help_text="Category id. Omit to leave the product uncategorised.",
    )
    sku = NormalizedSKUField(
        required=False,
        allow_null=True,
        allow_blank=True,
        validators=[
            validate_sku,
            UniqueValidator(
                queryset=Product.objects.all(), message="A product with this SKU already exists."
            ),
        ],
    )
    images = ProductImageSerializer(many=True, read_only=True)
    final_price = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    is_on_sale = serializers.BooleanField(read_only=True)
    discount_percentage = serializers.IntegerField(read_only=True)
    in_stock = serializers.BooleanField(read_only=True)

    class Meta:
        model = Product
        fields = (
            "id",
            "category",
            "category_id",
            "name",
            "slug",
            "description",
            "price",
            "discount_price",
            "final_price",
            "discount_percentage",
            "is_on_sale",
            "stock",
            "in_stock",
            "sku",
            "image_url",
            "images",
            "is_active",
            "created_at",
            "updated_at",
        )
        read_only_fields = (
            "id",
            "slug",
            "final_price",
            "discount_percentage",
            "is_on_sale",
            "in_stock",
            "created_at",
            "updated_at",
        )
        extra_kwargs = {
            "description": {"required": False, "allow_blank": True, "allow_null": True},
            "image_url": {"required": False, "allow_blank": True, "allow_null": True},
            "discount_price": {"required": False, "allow_null": True},
            "stock": {"required": False, "min_value": 0},
            "is_active": {"required": False},
        }

    image_prefix = "products"

    def validate(self, attrs: dict) -> dict:
        attrs = super().validate(attrs)
        request = self.context.get("request")
        user = getattr(request, "user", None)

        instance = self.instance
        price = attrs.get("price", getattr(instance, "price", None))
        discount_price = attrs.get("discount_price", getattr(instance, "discount_price", None))
        validate_price_rules(price=price, discount_price=discount_price)

        category = attrs.get("category", getattr(instance, "category", None))
        if category is not None and not category.is_active:
            raise serializers.ValidationError(
                {"category_id": ["Products cannot be assigned to an inactive category."]}
            )

        if not is_admin(user):
            # Defence in depth: only admins reach these endpoints at all.
            for protected in ("is_active", "stock"):
                attrs.pop(protected, None)

        return attrs

    def validate_price(self, value):
        if value is not None and value <= 0:
            raise serializers.ValidationError("Price must be greater than zero.")
        return value

    def validate_stock(self, value):
        if value is not None and value < 0:
            raise serializers.ValidationError("Stock cannot be negative.")
        return value

    def validate_sku(self, value):
        # An emptied SKU is stored as NULL, which the unique index tolerates.
        return value or None


class ProductStockUpdateSerializer(serializers.Serializer):
    """Payload for the staff stock adjustment endpoint."""

    stock = serializers.IntegerField(min_value=0, max_value=1_000_000)
    mode = serializers.ChoiceField(choices=("set", "increment", "decrement"), default="set")
