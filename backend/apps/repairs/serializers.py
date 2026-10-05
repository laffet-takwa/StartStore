"""
Serializers for repairs app.
"""
from rest_framework import serializers
from .models import RepairTicket, RepairImage, RepairPart, RepairStatus, RepairStatusHistory, PublicRepairTracking
from apps.customers.serializers import CustomerListSerializer, DeviceListSerializer
from apps.inventory.serializers import ProductListSerializer
from apps.accounts.serializers import EmployeeListSerializer


class RepairImageSerializer(serializers.ModelSerializer):
    """Serializer for repair images."""
    uploaded_by_name = serializers.CharField(source='uploaded_by.get_full_name', read_only=True)

    class Meta:
        model = RepairImage
        fields = ['id', 'image', 'caption', 'uploaded_by', 'uploaded_by_name', 'created_at']
        read_only_fields = ['id', 'uploaded_by', 'created_at']


class RepairPartSerializer(serializers.ModelSerializer):
    """Serializer for repair parts."""
    product = ProductListSerializer(read_only=True)
    product_id = serializers.UUIDField(write_only=True)
    added_by_name = serializers.CharField(source='added_by.get_full_name', read_only=True)

    class Meta:
        model = RepairPart
        fields = ['id', 'product', 'product_id', 'quantity', 'unit_price', 'total_price', 'added_by', 'added_by_name', 'created_at']
        read_only_fields = ['id', 'total_price', 'added_by', 'created_at']


class RepairPartCreateSerializer(serializers.ModelSerializer):
    """Serializer for adding repair parts."""

    class Meta:
        model = RepairPart
        fields = ['product', 'quantity', 'unit_price']


class RepairStatusHistorySerializer(serializers.ModelSerializer):
    """Serializer for repair status history."""
    changed_by_name = serializers.CharField(source='changed_by.get_full_name', read_only=True)
    old_status_label = serializers.CharField(source='get_old_status_display', read_only=True)
    new_status_label = serializers.CharField(source='get_new_status_display', read_only=True)

    class Meta:
        model = RepairStatusHistory
        fields = ['id', 'old_status', 'old_status_label', 'new_status', 'new_status_label', 'changed_by', 'changed_by_name', 'note', 'created_at']
        read_only_fields = ['id', 'created_at']


class RepairListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for repair lists."""
    customer = CustomerListSerializer(read_only=True)
    device = DeviceListSerializer(read_only=True)
    technician = EmployeeListSerializer(read_only=True)
    status_label = serializers.CharField(source='get_status_display', read_only=True)
    can_transition = serializers.SerializerMethodField()
    parts_count = serializers.IntegerField(read_only=True)
    images_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = RepairTicket
        fields = [
            'id', 'ticket_number', 'tracking_matricule', 'customer', 'device',
            'technician', 'status', 'status_label', 'estimated_cost', 'final_cost',
            'estimated_completion_date', 'received_at', 'completed_at', 'delivered_at',
            'can_transition', 'parts_count', 'images_count', 'created_at', 'updated_at',
        ]

    def get_can_transition(self, obj):
        return [status for status in obj.can_transition]


class RepairDetailSerializer(serializers.ModelSerializer):
    """Full detail serializer for repair tickets."""
    customer = CustomerListSerializer(read_only=True)
    device = DeviceListSerializer(read_only=True)
    technician = EmployeeListSerializer(read_only=True)
    status_label = serializers.CharField(source='get_status_display', read_only=True)
    can_transition = serializers.SerializerMethodField()
    parts = RepairPartSerializer(many=True, read_only=True)
    images = RepairImageSerializer(many=True, read_only=True)
    status_history = RepairStatusHistorySerializer(many=True, read_only=True)

    class Meta:
        model = RepairTicket
        fields = [
            'id', 'ticket_number', 'tracking_matricule', 'customer', 'device',
            'technician', 'problem_description', 'diagnosis', 'repair_solution',
            'internal_notes', 'status', 'status_label', 'estimated_cost', 'final_cost',
            'estimated_completion_date', 'received_at', 'diagnosed_at', 'approved_at',
            'started_at', 'tested_at', 'ready_at', 'completed_at', 'delivered_at',
            'cancelled_at', 'can_transition', 'parts', 'images', 'status_history',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'ticket_number', 'tracking_matricule', 'created_at', 'updated_at']

    def get_can_transition(self, obj):
        return [status for status in obj.can_transition]


class RepairCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating repair tickets."""

    class Meta:
        model = RepairTicket
        fields = [
            'customer', 'device', 'technician', 'problem_description',
            'estimated_cost', 'estimated_completion_date', 'internal_notes',
        ]

    def validate(self, attrs):
        # Ensure device belongs to customer
        customer = attrs.get('customer')
        device = attrs.get('device')
        if device and device.customer != customer:
            raise serializers.ValidationError("Device does not belong to the selected customer")
        return attrs


class RepairUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating repair tickets."""

    class Meta:
        model = RepairTicket
        fields = [
            'technician', 'problem_description', 'diagnosis', 'repair_solution',
            'internal_notes', 'estimated_cost', 'final_cost', 'estimated_completion_date',
        ]


class RepairStatusUpdateSerializer(serializers.Serializer):
    """Serializer for updating repair status."""
    status = serializers.ChoiceField(choices=RepairStatus.choices)
    note = serializers.CharField(required=False, allow_blank=True)

    def validate_status(self, value):
        repair = self.context.get('repair')
        if repair and value not in repair.can_transition:
            raise serializers.ValidationError(
                f"Cannot transition from {repair.get_status_display()} to {dict(RepairStatus.choices).get(value)}"
            )
        return value


class PublicRepairTrackingSerializer(serializers.ModelSerializer):
    """
    Public serializer for customer repair tracking.
    Only exposes safe, non-sensitive information.
    """
    device = serializers.SerializerMethodField()
    repair = serializers.SerializerMethodField()

    class Meta:
        model = PublicRepairTracking
        fields = ['matricule', 'device', 'repair']

    def get_device(self, obj):
        return {
            'type': obj.device_type,
            'brand': obj.brand,
            'model': obj.model,
        }

    def get_repair(self, obj):
        return {
            'status': obj.status,
            'status_label': obj.status_label,
            'received_at': obj.received_at,
            'estimated_completion_date': obj.estimated_completion_date,
            'last_updated': obj.last_updated,
            'is_ready_for_pickup': obj.is_ready_for_pickup,
        }


class PublicRepairStatusSerializer(serializers.Serializer):
    """Serializer for public repair status query."""
    matricule = serializers.CharField(max_length=30)

    def validate_matricule(self, value):
        return value.upper().strip()