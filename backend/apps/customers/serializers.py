"""
Serializers for customers app.
"""
from rest_framework import serializers
from .models import Customer, Device, DeviceType, Governorate


class DeviceListSerializer(serializers.ModelSerializer):
    """Lightweight device serializer for lists."""
    device_type_display = serializers.CharField(source='get_device_type_display', read_only=True)

    class Meta:
        model = Device
        fields = [
            'id', 'device_type', 'device_type_display', 'brand', 'model',
            'serial_number', 'created_at',
        ]


class DeviceSerializer(serializers.ModelSerializer):
    """Full device serializer."""
    device_type_display = serializers.CharField(source='get_device_type_display', read_only=True)
    customer_name = serializers.CharField(source='customer.get_full_name', read_only=True)
    repair_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Device
        fields = [
            'id', 'customer', 'customer_name', 'device_type', 'device_type_display',
            'brand', 'model', 'serial_number', 'accessories',
            'physical_condition', 'notes', 'repair_count',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
        extra_kwargs = {
            'device_password': {'write_only': True},
        }


class DeviceCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating devices."""

    class Meta:
        model = Device
        fields = [
            'customer', 'device_type', 'brand', 'model', 'serial_number',
            'device_password', 'accessories', 'physical_condition', 'notes',
        ]


class CustomerListSerializer(serializers.ModelSerializer):
    """Lightweight customer serializer for lists."""
    full_name = serializers.ReadOnlyField()
    device_count = serializers.IntegerField(read_only=True)
    repair_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Customer
        fields = [
            'id', 'first_name', 'last_name', 'full_name', 'phone', 'email',
            'company_name', 'city', 'governorate', 'is_active',
            'device_count', 'repair_count', 'created_at',
        ]


class CustomerSerializer(serializers.ModelSerializer):
    """Full customer serializer with nested devices."""
    full_name = serializers.ReadOnlyField()
    devices = DeviceListSerializer(many=True, read_only=True)
    device_count = serializers.IntegerField(read_only=True)
    repair_count = serializers.IntegerField(read_only=True)
    total_spent = serializers.DecimalField(max_digits=12, decimal_places=3, read_only=True)

    class Meta:
        model = Customer
        fields = [
            'id', 'first_name', 'last_name', 'full_name', 'phone', 'email',
            'company_name', 'address', 'city', 'governorate', 'postal_code',
            'notes', 'is_active', 'devices', 'device_count', 'repair_count',
            'total_spent', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class CustomerCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating customers."""

    class Meta:
        model = Customer
        fields = [
            'first_name', 'last_name', 'phone', 'email', 'company_name',
            'address', 'city', 'governorate', 'postal_code', 'notes',
        ]


class CustomerUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating customers."""

    class Meta:
        model = Customer
        fields = [
            'first_name', 'last_name', 'phone', 'email', 'company_name',
            'address', 'city', 'governorate', 'postal_code', 'notes', 'is_active',
        ]


class GovernorateSerializer(serializers.Serializer):
    """Serializer for governorate choices."""
    value = serializers.CharField()
    label = serializers.CharField()


class DeviceTypeSerializer(serializers.Serializer):
    """Serializer for device type choices."""
    value = serializers.CharField()
    label = serializers.CharField()