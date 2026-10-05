"""Product query parameters."""

from __future__ import annotations

import uuid

from django.db.models import F, Q
from django_filters import rest_framework as filters

from products.models import Product


def _looks_like_uuid(value: str) -> bool:
    try:
        uuid.UUID(value)
    except (ValueError, AttributeError, TypeError):
        return False
    return True


class ProductFilterSet(filters.FilterSet):
    """Implements the documented catalogue query string.

    ``?category=`` accepts either a category id or a slug;
    ``?min_price``/``?max_price`` filter on the *effective* price (the discount
    price when one applies, otherwise the list price); ``?in_stock=true``
    limits the result set to items that can actually be bought.
    """

    category = filters.CharFilter(method="filter_category", help_text="Category id or slug.")
    min_price = filters.NumberFilter(field_name="effective_price", lookup_expr="gte")
    max_price = filters.NumberFilter(field_name="effective_price", lookup_expr="lte")
    search = filters.CharFilter(method="filter_search")
    in_stock = filters.BooleanFilter(method="filter_in_stock")
    is_on_sale = filters.BooleanFilter(method="filter_is_on_sale")

    class Meta:
        model = Product
        fields = ["is_active"]

    def filter_queryset(self, queryset):
        # Annotate before the field based filters run so min/max price can read
        # `effective_price`.
        return super().filter_queryset(queryset.with_effective_price())

    def filter_category(self, queryset, name, value):
        """Accept a category id (UUID or legacy int) or a slug."""
        value = str(value).strip()
        if not value:
            return queryset
        if value.isdigit() or _looks_like_uuid(value):
            return queryset.filter(Q(category_id=value) | Q(category__slug=value))
        return queryset.filter(category__slug=value)

    def filter_search(self, queryset, name, value):
        return queryset.filter(
            Q(name__icontains=value)
            | Q(description__icontains=value)
            | Q(sku__icontains=value)
        )

    def filter_in_stock(self, queryset, name, value):
        return queryset.filter(stock__gt=0) if value else queryset.filter(stock=0)

    def filter_is_on_sale(self, queryset, name, value):
        if value:
            return queryset.filter(discount_price__isnull=False, discount_price__lt=F("price"))
        return queryset.filter(Q(discount_price__isnull=True) | Q(discount_price__gte=F("price")))