"""Invoice serializers."""

from __future__ import annotations

from rest_framework import serializers

from invoices.models import Invoice


class InvoiceSerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(source="customer.__str__", read_only=True)
    sale_number = serializers.CharField(source="sale.sale_number", read_only=True)
    repair_ticket = serializers.CharField(source="repair.ticket_number", read_only=True)

    class Meta:
        model = Invoice
        fields = (
            "id",
            "invoice_number",
            "customer_id",
            "customer_name",
            "sale_id",
            "sale_number",
            "repair_id",
            "repair_ticket",
            "subtotal",
            "discount",
            "tax",
            "total",
            "payment_status",
            "issued_at",
            "notes",
            "created_at",
        )
        read_only_fields = fields


class InvoiceWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Invoice
        fields = (
            "customer_id",
            "sale_id",
            "repair_id",
            "subtotal",
            "discount",
            "tax",
            "total",
            "payment_status",
            "notes",
        )
