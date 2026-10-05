"""Employee serializers."""

from __future__ import annotations

from rest_framework import serializers

from employees.models import Employee


class EmployeeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Employee
        fields = (
            "id",
            "profile_id",
            "first_name",
            "last_name",
            "email",
            "phone",
            "role",
            "avatar_url",
            "is_active",
            "hire_date",
            "created_at",
            "updated_at",
        )
        read_only_fields = fields

    profile_id = serializers.UUIDField(source="profile.id", read_only=True)


class EmployeeWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Employee
        fields = (
            "first_name",
            "last_name",
            "email",
            "phone",
            "role",
            "avatar_url",
            "is_active",
            "hire_date",
        )

    def validate_email(self, value):
        return value.strip().lower()
