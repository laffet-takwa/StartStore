"""
Serializers for audit app.
"""
from rest_framework import serializers
from .models import AuditLog


class AuditLogSerializer(serializers.ModelSerializer):
    """Serializer for AuditLog model."""
    employee_name = serializers.CharField(source='employee.get_full_name', read_only=True)
    action_label = serializers.CharField(source='get_action_display', read_only=True)

    class Meta:
        model = AuditLog
        fields = [
            'id', 'employee', 'employee_name', 'action', 'action_label',
            'entity_type', 'entity_id', 'old_data', 'new_data',
            'ip_address', 'user_agent', 'created_at',
        ]
        read_only_fields = ['id', 'created_at']