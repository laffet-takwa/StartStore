"""Supplier serializers."""

from __future__ import annotations

from rest_framework import serializers

from suppliers.models import Supplier


class SupplierSerializer(serializers.ModelSerializer):
    class Meta:
        model = Supplier
        fields = (
            "id",
            "name",
            "contact_person",
            "phone",
            "email",
            "address",
            "city",
            "notes",
            "is_active",
            "created_at",
            "updated_at",
        )
        read_only_fields = fields


class SupplierWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Supplier
        fields = (
            "name",
            "contact_person",
            "phone",
            "email",
            "address",
            "city",
            "notes",
            "is_active",
        )
