"""Content serializers."""

from __future__ import annotations

from rest_framework import serializers

from content.models import EducationalContent


class EducationalContentSerializer(serializers.ModelSerializer):
    author_name = serializers.CharField(source="author.full_name", read_only=True)

    class Meta:
        model = EducationalContent
        fields = (
            "id",
            "title",
            "slug",
            "description",
            "content",
            "content_type",
            "category",
            "cover_image_url",
            "video_url",
            "source_code_url",
            "author_name",
            "status",
            "views",
            "published_at",
            "created_at",
            "updated_at",
        )
        read_only_fields = fields


class EducationalContentWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = EducationalContent
        fields = (
            "title",
            "description",
            "content",
            "content_type",
            "category",
            "cover_image_url",
            "video_url",
            "source_code_url",
            "status",
        )
