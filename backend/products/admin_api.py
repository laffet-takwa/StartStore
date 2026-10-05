"""Staff-only product endpoints (``/api/admin/products/``).

The admin console needs the full catalogue - including inactive rows and the
aggregate figures the public list endpoint deliberately hides.
"""

from __future__ import annotations

from decimal import Decimal

from django.db.models import Count, DecimalField, F, Q, Sum, Value
from django.db.models.functions import Coalesce
from django_filters import rest_framework as filters
from drf_spectacular.utils import extend_schema
from rest_framework import mixins, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from common.permissions import IsAdmin
from products.models import Product
from products.serializers import ProductSerializer

MONEY = DecimalField(max_digits=16, decimal_places=2)
#: Mirrors ``common.services.dashboard.LOW_STOCK_THRESHOLD``.
LOW_STOCK_THRESHOLD = 5


class AdminProductFilterSet(filters.FilterSet):
    search = filters.CharFilter(method="filter_search")
    category = filters.CharFilter(method="filter_category")

    class Meta:
        model = Product
        fields = ["is_active", "category"]

    def filter_search(self, queryset, name, value):
        return queryset.filter(name__icontains=value)

    def filter_category(self, queryset, name, value):
        from products.filters import _looks_like_uuid

        value = str(value).strip()
        if not value:
            return queryset
        if value.isdigit() or _looks_like_uuid(value):
            return queryset.filter(Q(category_id=value) | Q(category__slug=value))
        return queryset.filter(category__slug=value)


class AdminProductViewSet(
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    viewsets.GenericViewSet,
):
    """Every product, active or not, annotated with units sold."""

    serializer_class = ProductSerializer
    permission_classes = [IsAdmin]
    filterset_class = AdminProductFilterSet
    ordering_fields = ("name", "price", "stock", "created_at", "units_sold")
    ordering = ("-created_at",)
    queryset = (
        Product.objects.select_related("category")
        .prefetch_related("images")
        .annotate(units_sold=Coalesce(Sum("order_items__quantity"), Value(0)))
    )

    @extend_schema(
        tags=["admin"],
        summary="List every product",
        description="Includes inactive products. `ordering=units_sold` is supported.",
        responses={200: ProductSerializer(many=True)},
    )
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)

    @extend_schema(
        tags=["admin"],
        summary="Catalogue and inventory totals",
        responses={200: None},
    )
    @action(detail=False, methods=["get"], url_path="summary")
    def summary(self, request, *args, **kwargs) -> Response:
        aggregate = Product.objects.aggregate(
            total=Count("id"),
            active=Count("id", filter=Product.objects.filter(is_active=True).query.where),
            out_of_stock=Count("id", filter=Product.objects.filter(is_active=True, stock=0).query.where),
            low_stock=Count(
                "id",
                filter=Product.objects.filter(
                    is_active=True, stock__lte=LOW_STOCK_THRESHOLD
                ).query.where,
            ),
            units_in_stock=Coalesce(Sum("stock"), Value(0)),
            inventory_value=Coalesce(
                Sum(F("price") * F("stock")), Value(Decimal("0")), output_field=MONEY
            ),
        )
        return Response(
            {
                "total": aggregate["total"],
                "active": aggregate["active"],
                "inactive": aggregate["total"] - aggregate["active"],
                "out_of_stock": aggregate["out_of_stock"],
                "low_stock": aggregate["low_stock"],
                "low_stock_threshold": LOW_STOCK_THRESHOLD,
                "units_in_stock": aggregate["units_in_stock"],
                "inventory_value": f"{aggregate['inventory_value']:.2f}",
            }
        )