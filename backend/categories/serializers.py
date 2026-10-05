"""Category serializers."""

from __future__ import annotations

from rest_framework import serializers

from categories.models import Category
from common.permissions import is_admin
from common.serializers import ImageUploadFieldsMixin


class CategorySerializer(ImageUploadFieldsMixin, serializers.ModelSerializer):
    """Full category representation.

    ``name`` is not unique in the database, so two categories may share a name
    while keeping distinct slugs. Inactive categories are only visible to staff,
    which also prevents linking a public product to a hidden category.
    """

    product_count = serializers.IntegerField(read_only=True, required=False)

    class Meta:
        model = Category
        fields = (
            "id",
            "name",
            "slug",
            "description",
            "image_url",
            "is_active",
            "product_count",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "slug", "created_at", "updated_at")
        extra_kwargs = {
            "description": {"required": False, "allow_blank": True, "allow_null": True},
            "image_url": {"required": False, "allow_blank": True, "allow_null": True},
            "is_active": {"required": False},
        }

    image_prefix = "categories"

    def validate_name(self, value: str) -> str:
        cleaned = " ".join(value.split())
        if not cleaned:
            raise serializers.ValidationError("A category name is required.")
        return cleaned

    def validate(self, attrs: dict) -> dict:
        attrs = super().validate(attrs)
        request = self.context.get("request")
        is_active = attrs.get("is_active", getattr(self.instance, "is_active", True))
        if not is_active and not is_admin(getattr(request, "user", None)):
            raise serializers.ValidationError(
                {"is_active": ["Only administrators can change category visibility."]}
            )
        return attrs