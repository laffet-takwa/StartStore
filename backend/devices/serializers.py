"""Device serializers."""

from __future__ import annotations

from rest_framework import serializers

from devices.models import Device


class DeviceSerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(source="customer.__str__", read_only=True)

    class Meta:
        model = Device
        fields = (
            "id",
            "customer_id",
            "customer_name",
            "device_type",
            "brand",
            "model",
            "serial_number",
            "accessories",
            "physical_condition",
            "notes",
            "created_at",
            "updated_at",
        )
        read_only_fields = fields


class DeviceWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Device
        fields = (
            "customer_id",
            "device_type",
            "brand",
            "model",
            "serial_number",
            "device_password",
            "accessories",
            "physical_condition",
            "notes",
        )
