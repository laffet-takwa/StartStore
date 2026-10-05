"""Robotics serializers."""

from __future__ import annotations

from rest_framework import serializers

from robotics.models import RoboticsProject


class RoboticsProjectSerializer(serializers.ModelSerializer):
    author_name = serializers.CharField(source="author.full_name", read_only=True)

    class Meta:
        model = RoboticsProject
        fields = (
            "id",
            "title",
            "slug",
            "description",
            "difficulty",
            "estimated_cost",
            "components",
            "instructions",
            "image_url",
            "video_url",
            "source_code_url",
            "author_name",
            "status",
            "views",
            "created_at",
            "updated_at",
        )
        read_only_fields = fields


class RoboticsProjectWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = RoboticsProject
        fields = (
            "title",
            "description",
            "difficulty",
            "estimated_cost",
            "components",
            "instructions",
            "image_url",
            "video_url",
            "source_code_url",
            "status",
        )
