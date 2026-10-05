"""Sales endpoints."""

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
from common.permissions import IsAdmin, IsManager, IsSales
from customers.models import Customer
from employees.models import Employee
from products.models import Product
from sales.models import Sale, SaleItem
from sales.serializers import (
    SaleItemCreateSerializer,
    SalePaymentSerializer,
    SaleSerializer,
    SaleWriteSerializer,
)


class SaleFilterSet:
    @staticmethod
    def filter_queryset(queryset, params):
        status_param = params.get("status")
        if status_param:
            queryset = queryset.filter(status=status_param)
        payment_status = params.get("payment_status")
        if payment_status:
            queryset = queryset.filter(payment_status=payment_status)
        search = params.get("search")
        if search:
            queryset = queryset.filter(sale_number__icontains=search)
        return queryset


class SaleViewSet(viewsets.ModelViewSet):
    queryset = Sale.objects.all()
    filterset_fields = ["status", "payment_status"]
    search_fields = ["sale_number", "customer__first_name", "customer__last_name"]
    ordering_fields = ["created_at", "total", "status", "payment_status"]
    ordering = ["-created_at"]
    http_method_names = ["get", "post", "patch", "head", "options"]

    def get_permissions(self):
        if self.action in ("create", "update", "partial_update", "destroy"):
            self.permission_classes = [IsAdmin | IsManager | IsSales]
        else:
            self.permission_classes = [IsAdmin | IsManager | IsSales]
        return super().get_permissions()

    def get_queryset(self):
        qs = super().get_queryset().select_related("customer", "employee").prefetch_related("items")
        return SaleFilterSet.filter_queryset(qs, self.request.query_params)

    def get_serializer_class(self):
        if self.action in ("create",):
            return SaleWriteSerializer
        if self.action == "payment":
            return SalePaymentSerializer
        return SaleSerializer

    def _get_employee(self, request):
        employee = None
        if request.user and request.user.is_authenticated:
            try:
                employee = Employee.objects.get(profile=request.user)
            except Employee.DoesNotExist:
                pass
        return employee

    def _calculate_totals(self, items_data, discount, tax):
        subtotal = Decimal("0.00")
        for item in items_data:
            product = Product.objects.get(pk=item["product_id"])
            subtotal += product.final_price * item["quantity"]
        total = (subtotal - discount) + tax
        if total < 0:
            total = Decimal("0.00")
        return subtotal, total

    @extend_schema(
        tags=["sales"],
        summary="List sales",
        responses={200: SaleSerializer(many=True)},
    )
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)

    @extend_schema(
        tags=["sales"],
        summary="Create a sale",
        request=SaleWriteSerializer,
        responses={201: SaleSerializer},
    )
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        customer = None
        if data.get("customer_id"):
            try:
                customer = Customer.objects.get(pk=data["customer_id"])
            except Customer.DoesNotExist:
                return Response({"detail": "Customer not found."}, status=status.HTTP_404_NOT_FOUND)

        employee = self._get_employee(request)
        items_data = data["items"]
        discount = data.get("discount", Decimal("0.00"))
        tax = data.get("tax", Decimal("0.00"))

        subtotal, total = self._calculate_totals(items_data, discount, tax)

        with transaction.atomic():
            sale = Sale.objects.create(
                customer=customer,
                employee=employee,
                subtotal=subtotal,
                discount=discount,
                tax=tax,
                total=total,
                notes=data.get("notes", ""),
            )
            for item_data in items_data:
                product = Product.objects.get(pk=item_data["product_id"])
                SaleItem.objects.create(
                    sale=sale,
                    product=product,
                    quantity=item_data["quantity"],
                    unit_price=product.final_price,
                )
        return Response(SaleSerializer(sale).data, status=status.HTTP_201_CREATED)

    @extend_schema(
        tags=["sales"],
        summary="Confirm a sale",
        description="Validates stock, locks inventory, calculates totals server-side and deducts stock atomically.",
        request=None,
        responses={200: SaleSerializer},
    )
    @action(detail=True, methods=["post"])
    def confirm(self, request, pk=None):
        sale = self.get_object()
        if sale.status != "draft":
            return Response({"detail": "Sale is not in draft status."}, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            items = sale.items.select_related("product").all()
            for item in items:
                product = item.product
                if product.stock < item.quantity:
                    raise BusinessRuleError(
                        f"Insufficient stock for {product.name}. Available: {product.stock}.",
                        code="insufficient_stock",
                    )
            for item in items:
                product = item.product
                Product.objects.filter(pk=product.pk).update(stock=F("stock") - item.quantity)
            sale.status = "confirmed"
            sale.save(update_fields=["status", "updated_at"])
        return Response(SaleSerializer(sale).data)

    @extend_schema(
        tags=["sales"],
        summary="Cancel a sale",
        request=None,
        responses={200: SaleSerializer},
    )
    @action(detail=True, methods=["post"])
    def cancel(self, request, pk=None):
        sale = self.get_object()
        if sale.status == "cancelled":
            return Response({"detail": "Sale is already cancelled."}, status=status.HTTP_400_BAD_REQUEST)
        with transaction.atomic():
            if sale.status == "confirmed":
                for item in sale.items.select_related("product").all():
                    Product.objects.filter(pk=item.product.pk).update(stock=F("stock") + item.quantity)
            sale.status = "cancelled"
            sale.save(update_fields=["status", "updated_at"])
        return Response(SaleSerializer(sale).data)

    @extend_schema(
        tags=["sales"],
        summary="Record a payment",
        request=SalePaymentSerializer,
        responses={200: SaleSerializer},
    )
    @action(detail=True, methods=["post"])
    def payment(self, request, pk=None):
        sale = self.get_object()
        serializer = SalePaymentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        amount = serializer.validated_data["amount"]
        method = serializer.validated_data["method"]
        reference = serializer.validated_data.get("reference", "")

        with transaction.atomic():
            from payments.models import Payment
            Payment.objects.create(
                sale=sale,
                amount=amount,
                payment_method=method,
                reference=reference,
            )
            total_paid = sum(p.amount for p in sale.payments.all())
            if total_paid >= sale.total:
                sale.payment_status = "paid"
            elif total_paid > 0:
                sale.payment_status = "partial"
            sale.save(update_fields=["payment_status", "updated_at"])
        return Response(SaleSerializer(sale).data)
