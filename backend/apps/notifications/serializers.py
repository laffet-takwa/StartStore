"""
Serializers for notifications app.
"""
from rest_framework import serializers
from .models import Notification


class NotificationSerializer(serializers.ModelSerializer):
    """Serializer for Notification model."""
    type_label = serializers.CharField(source='get_type_display', read_only=True)
    employee_name = serializers.CharField(source='employee.get_full_name', read_only=True)

    class Meta:
        model = Notification
        fields = [
            'id', 'employee', 'employee_name', 'title', 'message',
            'type', 'type_label', 'is_read', 'reference_type',
            'reference_id', 'created_at',
        ]
        read_only_fields = ['id', 'created_at']


class NotificationListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for notification lists."""
    type_label = serializers.CharField(source='get_type_display', read_only=True)

    class Meta:
        model = Notification
        fields = [
            'id', 'title', 'message', 'type', 'type_label',
            'is_read', 'reference_type', 'reference_id', 'created_at',
        ]