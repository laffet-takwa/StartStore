"""Serializer building blocks reused across apps."""

from __future__ import annotations

from django.core.files.uploadedfile import UploadedFile
from rest_framework import serializers

from common.images import DEFAULT_MAX_DIMENSION, process_and_store_image


class ImageUploadFieldsMixin:
    """Adds a write-only ``image`` upload that populates ``image_url``.

    * ``image`` accepts a multipart file upload (input only, never echoed back).
    * ``validated_data["image_url"]`` receives the stored public URL.
    * An existing ``image_url`` is left untouched when no file is uploaded.

    The field is injected through ``get_fields`` rather than declared as a class
    attribute: DRF's metaclass only collects ``Field`` instances from classes
    that are themselves serializers, so a plain mixin attribute would be ignored.
    For the same reason ``image`` must stay out of ``Meta.fields`` - it is not a
    model column, and ``ModelSerializer.get_fields`` rejects unknown names.

    Subclasses may override :attr:`image_prefix` and :attr:`image_max_dimension`.
    """

    image_prefix = "images"
    image_max_dimension = DEFAULT_MAX_DIMENSION

    image_field_help = "Optional image upload. Takes precedence over image_url."

    def get_fields(self) -> dict:
        fields = super().get_fields()
        fields.setdefault(
            "image",
            serializers.ImageField(
                write_only=True,
                required=False,
                allow_null=True,
                help_text=self.image_field_help,
            ),
        )
        return fields

    def validate(self, attrs: dict) -> dict:
        attrs = super().validate(attrs)
        upload = attrs.pop("image", None)
        if isinstance(upload, UploadedFile):
            processed = process_and_store_image(
                upload,
                prefix=self.image_prefix,
                max_dimension=self.image_max_dimension,
            )
            attrs["image_url"] = processed.url
        return attrs