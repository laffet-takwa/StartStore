"""Category endpoints."""

from __future__ import annotations

from django.db import models
from django.db.models import Q
from django_filters import rest_framework as filters
from drf_spectacular.utils import extend_schema
from rest_framework import status, viewsets
from rest_framework.response import Response

from categories.models import Category
from categories.serializers import CategorySerializer
from common.mixins import PublicReadAdminWriteQuerysetMixin
from common.permissions import IsAdminOrReadOnly


def active_products_count() -> models.Count:
    """Reusable annotation counting active products per category."""
    return models.Count("products", filter=models.Q(products__is_active=True), distinct=True)


class CategoryFilterSet(filters.FilterSet):
    search = filters.CharFilter(method="filter_search")
    has_products = filters.BooleanFilter(method="filter_has_products")

    class Meta:
        model = Category
        fields = ["is_active"]

    def filter_search(self, queryset, name, value):
        return queryset.filter(Q(name__icontains=value) | Q(description__icontains=value))

    def filter_has_products(self, queryset, name, value):
        queryset = queryset.annotate(flagged_product_count=active_products_count())
        if value:
            return queryset.filter(flagged_product_count__gt=0)
        return queryset.filter(flagged_product_count=0)


class CategoryViewSet(PublicReadAdminWriteQuerysetMixin, viewsets.ModelViewSet):
    """Public catalogue navigation, admin managed taxonomy.

    * ``GET`` is open; inactive categories are hidden from non-staff callers.
    * ``POST``/``PATCH``/``DELETE`` require the ``admin`` role.
    * ``DELETE`` soft-deactivates instead of removing rows that historic orders
      still reference.
    """

    serializer_class = CategorySerializer
    permission_classes = [IsAdminOrReadOnly]
    queryset = Category.objects.all()
    filterset_class = CategoryFilterSet
    search_fields = ("name", "description")
    ordering_fields = ("name", "created_at", "updated_at")
    ordering = ("name",)
    http_method_names = ["get", "post", "patch", "delete", "head", "options"]

    def get_queryset(self):
        return super().get_queryset().with_product_counts()

    @extend_schema(
        tags=["categories"],
        summary="List categories",
        description="Public. Inactive categories are only visible to staff.",
        responses={200: CategorySerializer(many=True)},
    )
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)

    @extend_schema(
        tags=["categories"],
        summary="Create a category",
        request=CategorySerializer,
        responses={201: CategorySerializer},
    )
    def create(self, request, *args, **kwargs):
        return super().create(request, *args, **kwargs)

    @extend_schema(
        tags=["categories"],
        summary="Update a category",
        request=CategorySerializer,
        responses={200: CategorySerializer},
    )
    def partial_update(self, request, *args, **kwargs):
        return super().partial_update(request, *args, **kwargs)

    @extend_schema(
        tags=["categories"],
        summary="Deactivate a category",
        description=(
            "Soft delete: the row is flagged inactive so existing orders keep their "
            "history while the category disappears from the public catalogue. "
            "Products are left untouched."
        ),
        request=None,
        responses={204: None},
    )
    def destroy(self, request, *args, **kwargs):
        category = self.get_object()
        category.is_active = False
        category.save(update_fields=["is_active", "updated_at"])
        return Response(status=status.HTTP_204_NO_CONTENT)