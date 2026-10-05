"""Inventory endpoints."""

from __future__ import annotations

from decimal import Decimal
from typing import Iterable

from django.db import transaction
from django.db.models import F, Q
from drf_spectacular.utils import OpenApiParameter, extend_schema
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from common.exceptions import BusinessRuleError
from common.permissions import IsAdmin, IsManager, IsTechnician, IsSales
from inventory.models import StockMovement
from inventory.serializers import StockMovementCreateSerializer, StockMovementSerializer
from products.models import Product


INVENTORY_FILTER_PARAMETERS = [
    OpenApiParameter("search", str, description="Search by product name or SKU."),
    OpenApiParameter("stock_status", str, description="Filter by stock status."),
    OpenApiParameter("ordering", str, description="Ordering field."),
]


class InventoryViewSet(viewsets.ViewSet):
    permission_classes = [IsAdmin | IsManager | IsTechnician | IsSales]
    http_method_names = ["get", "post", "head", "options"]

    def get_queryset(self):
        return StockMovement.objects.all()

    @extend_schema(
        tags=["inventory"],
        summary="List inventory items",
        parameters=INVENTORY_FILTER_PARAMETERS,
        responses={200: StockMovementSerializer(many=True)},
    )
    def list(self, request, *args, **kwargs):
        # For simplicity, list movements with optional product filter
        qs = StockMovement.objects.select_related("product", "created_by").order_by("-created_at")
        search = request.query_params.get("search")
        if search:
            qs = qs.filter(Q(product__name__icontains=search) | Q(product__sku__icontains=search))
        page = self.paginate_queryset(qs)
        serializer = StockMovementSerializer(page, many=True)
        return self.get_paginated_response(serializer.data)

    def paginate_queryset(self, queryset):
        page = self.request.query_params.get("page", 1)
        page_size = self.request.query_params.get("page_size", 20)
        try:
            page = int(page)
            page_size = int(page_size)
        except (TypeError, ValueError):
            page = 1
            page_size = 20
        page_size = max(1, min(page_size, 100))
        total = queryset.count()
        start = (page - 1) * page_size
        end = start + page_size
        return {
            "results": queryset[start:end],
            "count": total,
            "next": page * page_size < total,
            "previous": page > 1,
        }

    def get_paginated_response(self, data):
        page = self.request.query_params.get("page", 1)
        try:
            page = int(page)
        except (TypeError, ValueError):
            page = 1
        return Response(
            {
                "count": self.paginate_queryset(StockMovement.objects.all())["count"],
                "next": f"?page={page + 1}" if self.paginate_queryset(StockMovement.objects.all())["next"] else None,
                "previous": f"?page={page - 1}" if page > 1 else None,
                "results": data,
            }
        )

    @extend_schema(
        tags=["inventory"],
        summary="List stock movements",
        responses={200: StockMovementSerializer(many=True)},
    )
    @action(detail=False, methods=["get"])
    def movements(self, request, *args, **kwargs):
        return self.list(request, *args, **kwargs)

    @extend_schema(
        tags=["inventory"],
        summary="Adjust inventory",
        request=StockMovementCreateSerializer,
        responses={201: StockMovementSerializer},
    )
    @action(detail=False, methods=["post"])
    def adjust(self, request, *args, **kwargs):
        serializer = StockMovementCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        try:
            product = Product.objects.get(pk=data["product_id"])
        except Product.DoesNotExist:
            return Response({"detail": "Product not found."}, status=status.HTTP_404_NOT_FOUND)

        movement_type = data["movement_type"]
        quantity = data["quantity"]

        with transaction.atomic():
            if movement_type in ("sale", "repair_usage", "damaged"):
                if product.stock < quantity:
                    raise BusinessRuleError(
                        f"Insufficient stock. Only {product.stock} units available.",
                        code="insufficient_stock",
                    )
                Product.objects.filter(pk=product.pk).update(stock=F("stock") - quantity)
            elif movement_type in ("purchase", "return", "adjustment"):
                Product.objects.filter(pk=product.pk).update(stock=F("stock") + quantity)
            else:
                raise BusinessRuleError(
                    f"Unsupported movement type: {movement_type}",
                    code="invalid_movement_type",
                )

            employee = None
            if request.user and request.user.is_authenticated:
                try:
                    from employees.models import Employee
                    employee = Employee.objects.get(profile=request.user)
                except Exception:
                    pass

            movement = StockMovement.objects.create(
                product=product,
                movement_type=movement_type,
                quantity=quantity,
                reference_type=data.get("reference_type"),
                reference_id=data.get("reference_id"),
                reason=data.get("reason"),
                created_by=employee,
            )

        return Response(StockMovementSerializer(movement).data, status=status.HTTP_201_CREATED)
