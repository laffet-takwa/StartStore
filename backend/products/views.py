"""Product endpoints."""

from __future__ import annotations

from decimal import Decimal

from django.db.models import F
from django.shortcuts import get_object_or_404
from drf_spectacular.utils import OpenApiParameter, extend_schema
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from common.exceptions import BusinessRuleError
from common.mixins import PublicReadAdminWriteQuerysetMixin
from common.permissions import IsAdmin, IsAdminOrReadOnly
from products.filters import ProductFilterSet
from products.models import Product, ProductImage
from products.serializers import (
    ProductImageSerializer,
    ProductSerializer,
    ProductStockUpdateSerializer,
)

PRODUCT_FILTER_PARAMETERS = [
    OpenApiParameter(
        "category",
        str,
        description="Category id or slug.",
    ),
    OpenApiParameter("min_price", float, description="Lowest effective price, inclusive."),
    OpenApiParameter("max_price", float, description="Highest effective price, inclusive."),
    OpenApiParameter("search", str, description="Matches name, description or SKU."),
    OpenApiParameter(
        "ordering",
        str,
        description=(
            "Comma separated fields. Allowed: name, -name, price, -price, "
            "discount_price, -discount_price, stock, -stock, created_at, -created_at."
        ),
    ),
    OpenApiParameter("in_stock", bool, description="Only products with stock available."),
    OpenApiParameter("is_on_sale", bool, description="Only discounted products."),
]


class ProductViewSet(PublicReadAdminWriteQuerysetMixin, viewsets.ModelViewSet):
    """The catalogue.

    * Public and customer requests read active products only.
    * Only admins may create, update or deactivate products.
    * ``DELETE`` soft-deactivates so order history keeps its references.
    """

    serializer_class = ProductSerializer
    permission_classes = [IsAdminOrReadOnly]
    queryset = Product.objects.all()
    filterset_class = ProductFilterSet
    search_fields = ("name", "description", "sku")
    ordering_fields = ("name", "price", "discount_price", "stock", "created_at", "updated_at")
    ordering = ("-created_at",)
    http_method_names = ["get", "post", "patch", "delete", "head", "options"]

    def get_queryset(self):
        # ``with_related`` removes N+1 queries on category + gallery images.
        # Ordering comes from ``Product.Meta.ordering`` unless the client asks
        # for something else, which DRF's OrderingFilter then applies.
        return super().get_queryset().with_related()

    @extend_schema(
        tags=["products"],
        summary="List products",
        parameters=PRODUCT_FILTER_PARAMETERS,
        responses={200: ProductSerializer(many=True)},
    )
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)

    @extend_schema(
        tags=["products"],
        summary="Create a product",
        description="Admin only. Price, stock and visibility are all server owned.",
        request=ProductSerializer,
        responses={201: ProductSerializer},
    )
    def create(self, request, *args, **kwargs):
        return super().create(request, *args, **kwargs)

    @extend_schema(
        tags=["products"],
        summary="Update a product",
        request=ProductSerializer,
        responses={200: ProductSerializer},
    )
    def partial_update(self, request, *args, **kwargs):
        return super().partial_update(request, *args, **kwargs)

    @extend_schema(
        tags=["products"],
        summary="Deactivate a product",
        description="Soft delete. The row survives so historic orders stay intact.",
        request=None,
        responses={204: None},
    )
    def destroy(self, request, *args, **kwargs):
        product = self.get_object()
        product.is_active = False
        product.save(update_fields=["is_active", "updated_at"])
        return Response(status=status.HTTP_204_NO_CONTENT)

    @extend_schema(
        tags=["products"],
        summary="Adjust stock",
        request=ProductStockUpdateSerializer,
        responses={200: ProductSerializer},
    )
    @action(detail=True, methods=["patch"], permission_classes=[IsAdmin])
    def stock(self, request, *args, **kwargs) -> Response:
        """Set, increment or decrement stock atomically."""
        product = self.get_object()
        serializer = ProductStockUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        value = serializer.validated_data["stock"]
        mode = serializer.validated_data["mode"]

        if mode == "set":
            Product.objects.filter(pk=product.pk).update(stock=value)
        elif mode == "increment":
            Product.objects.filter(pk=product.pk).update(stock=F("stock") + value)
        else:
            if product.stock < value:
                raise BusinessRuleError(
                    f"Only {product.stock} units are in stock; cannot remove {value}.",
                    code="insufficient_stock",
                )
            Product.objects.filter(pk=product.pk).update(stock=F("stock") - value)

        product.refresh_from_db()
        return Response(self.get_serializer(product).data)


class ProductImageViewSet(viewsets.ModelViewSet):
    """Gallery management for a single product (``admin`` only)."""

    serializer_class = ProductImageSerializer
    permission_classes = [IsAdmin]
    queryset = ProductImage.objects.all()
    http_method_names = ["get", "post", "patch", "delete", "head", "options"]

    def get_product(self) -> Product:
        product_id = self.kwargs.get("product_id")
        product = get_object_or_404(Product.objects.select_related("category"), pk=product_id)
        return product

    def get_queryset(self):
        # Schema generation and the router's list probe have no product in the
        # URL yet, so fall back to an empty queryset instead of raising.
        product_id = self.kwargs.get("product_id")
        if not product_id or getattr(self, "swagger_fake_view", False):
            return self.queryset.none()
        return self.queryset.filter(product_id=product_id).select_related("product")

    def perform_create(self, serializer) -> None:
        serializer.save(product=self.get_product())

    @extend_schema(tags=["products"], summary="List a product's images", responses={200: ProductImageSerializer(many=True)})
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)

    @extend_schema(
        tags=["products"],
        summary="Attach an image",
        request=ProductImageSerializer,
        responses={201: ProductImageSerializer},
    )
    def create(self, request, *args, **kwargs):
        return super().create(request, *args, **kwargs)