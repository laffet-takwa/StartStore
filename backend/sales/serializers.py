"""Sales serializers."""

from __future__ import annotations

from rest_framework import serializers

from sales.models import Sale, SaleItem
from common.constants import PaymentStatus


class SaleItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source="product.name", read_only=True)

    class Meta:
        model = SaleItem
        fields = (
            "id",
            "product_id",
            "product_name",
            "quantity",
            "unit_price",
            "discount",
            "total_price",
            "created_at",
        )
        read_only_fields = fields


class SaleSerializer(serializers.ModelSerializer):
    items = SaleItemSerializer(many=True, read_only=True)
    customer_name = serializers.CharField(source="customer.__str__", read_only=True)
    employee_name = serializers.CharField(source="employee.full_name", read_only=True)

    class Meta:
        model = Sale
        fields = (
            "id",
            "sale_number",
            "customer_id",
            "customer_name",
            "employee_id",
            "employee_name",
            "items",
            "subtotal",
            "discount",
            "tax",
            "total",
            "status",
            "payment_status",
            "notes",
            "created_at",
            "updated_at",
        )
        read_only_fields = fields


class SaleWriteSerializer(serializers.Serializer):
    customer_id = serializers.UUIDField(required=False, allow_null=True)
    items = serializers.ListField(
        child=serializers.DictField(),
        min_length=1,
    )
    discount = serializers.DecimalField(max_digits=12, decimal_places=2, default=0, min_value=0)
    tax = serializers.DecimalField(max_digits=12, decimal_places=2, default=0, min_value=0)
    payment_method = serializers.ChoiceField(choices=PaymentStatus.choices, required=False)
    notes = serializers.CharField(required=False, allow_blank=True)


class SaleItemCreateSerializer(serializers.Serializer):
    product_id = serializers.UUIDField()
    quantity = serializers.IntegerField(min_value=1)


class SalePaymentSerializer(serializers.Serializer):
    amount = serializers.DecimalField(max_digits=12, decimal_places=2, min_value=0.01)
    method = serializers.ChoiceField(choices=PaymentStatus.choices)
    reference = serializers.CharField(required=False, allow_blank=True)
