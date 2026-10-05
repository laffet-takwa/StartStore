"""Repair serializers."""

from __future__ import annotations

from rest_framework import serializers

from repairs.models import Repair, RepairImage, RepairPart, RepairStatusHistory
from repairs.constants import RepairStatus, REPAIR_STATUS_META


class RepairImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = RepairImage
        fields = ("id", "image_url", "description", "created_at")
        read_only_fields = fields


class RepairPartSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source="product.name", read_only=True)

    class Meta:
        model = RepairPart
        fields = (
            "id",
            "product_id",
            "product_name",
            "quantity",
            "unit_price",
            "total_price",
            "created_at",
        )
        read_only_fields = fields


class RepairStatusHistorySerializer(serializers.ModelSerializer):
    old_status_display = serializers.CharField(source="get_old_status_display", read_only=True)
    new_status_display = serializers.CharField(source="get_new_status_display", read_only=True)
    changed_by_name = serializers.CharField(source="changed_by.full_name", read_only=True)

    class Meta:
        model = RepairStatusHistory
        fields = (
            "id",
            "old_status",
            "old_status_display",
            "new_status",
            "new_status_display",
            "changed_by_name",
            "note",
            "created_at",
        )
        read_only_fields = fields


class RepairSerializer(serializers.ModelSerializer):
    images = RepairImageSerializer(many=True, read_only=True)
    parts = RepairPartSerializer(many=True, read_only=True)
    status_history = RepairStatusHistorySerializer(many=True, read_only=True)
    customer_name = serializers.CharField(source="customer.__str__", read_only=True)
    technician_name = serializers.CharField(source="technician.full_name", read_only=True)
    status_display = serializers.CharField(source="get_status_display", read_only=True)
    status_meta = serializers.SerializerMethodField()

    class Meta:
        model = Repair
        fields = (
            "id",
            "ticket_number",
            "customer_id",
            "customer_name",
            "device_id",
            "technician_id",
            "technician_name",
            "problem_description",
            "diagnosis",
            "repair_solution",
            "internal_notes",
            "status",
            "status_display",
            "status_meta",
            "estimated_cost",
            "final_cost",
            "estimated_completion_date",
            "received_at",
            "completed_at",
            "delivered_at",
            "images",
            "parts",
            "status_history",
            "created_at",
            "updated_at",
        )
        read_only_fields = fields

    def get_status_meta(self, obj):
        return REPAIR_STATUS_META.get(obj.status, {})


class RepairWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Repair
        fields = (
            "customer_id",
            "device_id",
            "problem_description",
            "estimated_cost",
            "estimated_completion_date",
            "technician_id",
            "internal_notes",
        )

    def validate_estimated_cost(self, value):
        if value is not None and value < 0:
            raise serializers.ValidationError("Estimated cost cannot be negative.")
        return value


class RepairStatusUpdateSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=RepairStatus.choices)
    diagnosis = serializers.CharField(required=False, allow_blank=True)
    repair_solution = serializers.CharField(required=False, allow_blank=True)
    final_cost = serializers.DecimalField(max_digits=12, decimal_places=2, required=False)
    internal_notes = serializers.CharField(required=False, allow_blank=True)
    note = serializers.CharField(required=False, allow_blank=True)

    def validate_final_cost(self, value):
        if value is not None and value < 0:
            raise serializers.ValidationError("Final cost cannot be negative.")
        return value


class RepairPartCreateSerializer(serializers.Serializer):
    product_id = serializers.UUIDField()
    quantity = serializers.IntegerField(min_value=1)
    unit_price = serializers.DecimalField(max_digits=12, decimal_places=2, min_value=0)
