"""Customer serializers."""

from __future__ import annotations

from rest_framework import serializers

from customers.models import Customer


class CustomerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Customer
        fields = (
            "id",
            "profile_id",
            "first_name",
            "last_name",
            "phone",
            "email",
            "company_name",
            "address",
            "city",
            "governorate",
            "postal_code",
            "notes",
            "customer_type",
            "is_active",
            "created_at",
            "updated_at",
        )
        read_only_fields = fields

    profile_id = serializers.UUIDField(source="profile.id", read_only=True, allow_null=True)


class CustomerWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Customer
        fields = (
            "first_name",
            "last_name",
            "phone",
            "email",
            "company_name",
            "address",
            "city",
            "governorate",
            "postal_code",
            "notes",
            "customer_type",
            "is_active",
        )

    def validate_phone(self, value):
        return value.strip()

    def validate_email(self, value):
        return value.strip().lower() if value else value
