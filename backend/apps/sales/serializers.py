"""
Serializers for sales app.
"""
from rest_framework import serializers
from .models import Sale, SaleItem, Payment
from apps.customers.serializers import CustomerListSerializer
from apps.inventory.serializers import ProductListSerializer
from apps.accounts.serializers import EmployeeListSerializer
from apps.repairs.serializers import RepairListSerializer


class SaleItemSerializer(serializers.ModelSerializer):
    """Serializer for SaleItem model."""
    product = ProductListSerializer(read_only=True)
    product_id = serializers.UUIDField(write_only=True)

    class Meta:
        model = SaleItem
        fields = [
            'id', 'product', 'product_id', 'quantity',
            'unit_price', 'discount', 'total_price', 'created_at',
        ]
        read_only_fields = ['id', 'total_price', 'created_at']


class SaleItemCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating sale items."""

    class Meta:
        model = SaleItem
        fields = ['product', 'quantity', 'unit_price', 'discount']


class SaleListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for sale lists."""
    customer_name = serializers.CharField(source='customer.get_full_name', read_only=True)
    employee_name = serializers.CharField(source='employee.get_full_name', read_only=True)
    status_label = serializers.CharField(source='get_status_display', read_only=True)
    payment_status_label = serializers.CharField(source='get_payment_status_display', read_only=True)
    items_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Sale
        fields = [
            'id', 'sale_number', 'customer', 'customer_name', 'employee', 'employee_name',
            'subtotal', 'discount', 'tax', 'total', 'status', 'status_label',
            'payment_status', 'payment_status_label', 'items_count',
            'created_at', 'confirmed_at',
        ]


class SaleDetailSerializer(serializers.ModelSerializer):
    """Full detail serializer for sales."""
    customer = CustomerListSerializer(read_only=True)
    employee = EmployeeListSerializer(read_only=True)
    status_label = serializers.CharField(source='get_status_display', read_only=True)
    payment_status_label = serializers.CharField(source='get_payment_status_display', read_only=True)
    items = SaleItemSerializer(many=True, read_only=True)
    payments = serializers.SerializerMethodField()
    paid_amount = serializers.DecimalField(max_digits=12, decimal_places=3, read_only=True)
    remaining_amount = serializers.DecimalField(max_digits=12, decimal_places=3, read_only=True)

    class Meta:
        model = Sale
        fields = [
            'id', 'sale_number', 'customer', 'employee', 'subtotal', 'discount',
            'tax', 'total', 'status', 'status_label', 'payment_status',
            'payment_status_label', 'notes', 'items', 'payments',
            'paid_amount', 'remaining_amount',
            'created_at', 'updated_at', 'confirmed_at', 'cancelled_at',
        ]
        read_only_fields = ['id', 'sale_number', 'created_at', 'updated_at']

    def get_payments(self, obj):
        from .serializers import PaymentSerializer
        payments = obj.payments.all()
        return PaymentSerializer(payments, many=True).data


class SaleCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating sales."""
    items = SaleItemCreateSerializer(many=True)

    class Meta:
        model = Sale
        fields = [
            'customer', 'employee', 'discount', 'tax', 'notes', 'items',
        ]

    def validate_items(self, value):
        if not value:
            raise serializers.ValidationError("At least one item is required.")
        return value

    def create(self, validated_data):
        from django.db import transaction
        from apps.inventory.models import Product, InventoryMovement

        items_data = validated_data.pop('items')
        employee = validated_data.get('employee') or self.context['request'].user

        with transaction.atomic():
            # Create sale as draft first
            sale = Sale.objects.create(
                employee=employee,
                status=Sale.Status.DRAFT,
                **validated_data
            )

            subtotal = 0
            for item_data in items_data:
                product = item_data['product']
                quantity = item_data['quantity']
                unit_price = item_data.get('unit_price', product.selling_price)
                discount = item_data.get('discount', 0)

                # Lock product row
                product = Product.objects.select_for_update().get(pk=product.pk)

                if product.stock_quantity < quantity:
                    raise serializers.ValidationError(
                        f"Insufficient stock for {product.name}. Available: {product.stock_quantity}"
                    )

                item = SaleItem.objects.create(
                    sale=sale,
                    product=product,
                    quantity=quantity,
                    unit_price=unit_price,
                    discount=discount,
                )

                product.stock_quantity -= quantity
                product.save(update_fields=['stock_quantity', 'updated_at'])

                InventoryMovement.objects.create(
                    product=product,
                    movement_type=InventoryMovement.MovementType.SALE,
                    quantity=-quantity,
                    reference_type='sale',
                    reference_id=sale.id,
                    reason=f'Sale {sale.sale_number}',
                    created_by=employee,
                )

                subtotal += item.total_price

            sale.subtotal = subtotal
            sale.total = subtotal - sale.discount + sale.tax
            sale.save(update_fields=['subtotal', 'total', 'updated_at'])

        return sale


class SaleUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating sales (draft only)."""

    class Meta:
        model = Sale
        fields = ['customer', 'discount', 'tax', 'notes']

    def validate(self, attrs):
        if self.instance.status != Sale.Status.DRAFT:
            raise serializers.ValidationError("Only draft sales can be modified.")
        return attrs


class SaleConfirmSerializer(serializers.Serializer):
    """Serializer for confirming a sale."""
    pass


class PaymentSerializer(serializers.ModelSerializer):
    """Serializer for Payment model."""
    sale_number = serializers.CharField(source='sale.sale_number', read_only=True)
    repair_ticket_number = serializers.CharField(source='repair.ticket_number', read_only=True)
    payment_method_label = serializers.CharField(source='get_payment_method_display', read_only=True)

    class Meta:
        model = Payment
        fields = [
            'id', 'sale', 'sale_number', 'repair', 'repair_ticket_number',
            'amount', 'payment_method', 'payment_method_label',
            'reference', 'notes', 'paid_at', 'created_at',
        ]
        read_only_fields = ['id', 'created_at']


class PaymentCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating payments."""

    class Meta:
        model = Payment
        fields = ['sale', 'repair', 'amount', 'payment_method', 'reference', 'notes']

    def validate(self, attrs):
        sale = attrs.get('sale')
        repair = attrs.get('repair')

        if not sale and not repair:
            raise serializers.ValidationError("Payment must be linked to either a sale or a repair.")
        if sale and repair:
            raise serializers.ValidationError("Payment cannot be linked to both a sale and a repair.")

        return attrs

    def create(self, validated_data):
        from django.db import transaction
        from django.utils import timezone

        with transaction.atomic():
            payment = Payment.objects.create(**validated_data)

            # Update sale payment status
            if payment.sale:
                payment.sale.update_payment_status()

            # Update repair final cost
            if payment.repair:
                from django.db.models import Sum
                paid = payment.repair.payments.aggregate(total=Sum('amount'))['total'] or 0
                if paid >= (payment.repair.final_cost or payment.repair.estimated_cost or 0):
                    payment.repair.final_cost = paid
                    payment.repair.save(update_fields=['final_cost', 'updated_at'])

        return payment