"""
Serializers for invoices app.
"""
from rest_framework import serializers
from .models import Invoice
from apps.customers.serializers import CustomerSerializer
from apps.sales.serializers import SaleListSerializer
from apps.repairs.serializers import RepairListSerializer


class InvoiceSerializer(serializers.ModelSerializer):
    """Serializer for Invoice model."""
    customer = CustomerSerializer(read_only=True)
    sale = SaleListSerializer(read_only=True)
    repair = RepairListSerializer(read_only=True)

    class Meta:
        model = Invoice
        fields = [
            'id', 'invoice_number', 'customer', 'sale', 'repair',
            'subtotal', 'discount', 'tax', 'total',
            'issued_at', 'notes', 'created_at',
        ]
        read_only_fields = ['id', 'invoice_number', 'created_at']


class InvoiceListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for invoice lists."""
    customer_name = serializers.CharField(source='customer.get_full_name', read_only=True)
    source_type = serializers.SerializerMethodField()
    source_reference = serializers.SerializerMethodField()

    class Meta:
        model = Invoice
        fields = [
            'id', 'invoice_number', 'customer', 'customer_name',
            'source_type', 'source_reference', 'total', 'issued_at',
        ]

    def get_source_type(self, obj):
        if obj.sale:
            return 'sale'
        elif obj.repair:
            return 'repair'
        return 'manual'

    def get_source_reference(self, obj):
        if obj.sale:
            return obj.sale.sale_number
        elif obj.repair:
            return obj.repair.ticket_number
        return None


class InvoiceCreateSerializer(serializers.Serializer):
    """Serializer for creating invoices from sale or repair."""
    sale_id = serializers.UUIDField(required=False)
    repair_id = serializers.UUIDField(required=False)
    notes = serializers.CharField(required=False, allow_blank=True)

    def validate(self, attrs):
        sale_id = attrs.get('sale_id')
        repair_id = attrs.get('repair_id')

        if not sale_id and not repair_id:
            raise serializers.ValidationError("Either sale_id or repair_id is required.")
        if sale_id and repair_id:
            raise serializers.ValidationError("Cannot create invoice from both sale and repair.")

        return attrs