"""Notification serializers."""

from __future__ import annotations

from rest_framework import serializers

from notifications.models import Notification


class NotificationSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source="employee.full_name", read_only=True)

    class Meta:
        model = Notification
        fields = (
            "id",
            "employee_id",
            "employee_name",
            "title",
            "message",
            "type",
            "is_read",
            "reference_type",
            "reference_id",
            "created_at",
        )
        read_only_fields = fields


class NotificationMarkReadSerializer(serializers.Serializer):
    is_read = serializers.BooleanField(default=True)
