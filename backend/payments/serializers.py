"""Payment serializers."""

from __future__ import annotations

from rest_framework import serializers

from payments.models import Payment


class PaymentSerializer(serializers.ModelSerializer):
    sale_number = serializers.CharField(source="sale.sale_number", read_only=True)
    repair_ticket = serializers.CharField(source="repair.ticket_number", read_only=True)

    class Meta:
        model = Payment
        fields = (
            "id",
            "sale_id",
            "sale_number",
            "repair_id",
            "repair_ticket",
            "amount",
            "payment_method",
            "reference",
            "notes",
            "paid_at",
            "created_at",
        )
        read_only_fields = fields


class PaymentCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = (
            "sale_id",
            "repair_id",
            "amount",
            "payment_method",
            "reference",
            "notes",
        )
