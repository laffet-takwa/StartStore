"""Reusable serializer fields."""

from __future__ import annotations

from rest_framework import serializers

from common.validators import normalize_sku


class NormalizedSKUField(serializers.CharField):
    """A SKU field that normalises before running its validators.

    DRF runs ``to_internal_value`` *before* ``run_validators``, so normalising
    here means a ``UniqueValidator`` on this field queries the stored form
    (``ABC-1``). Normalising later - for example in ``validate_sku`` - would let
    ``abc-1`` slip past the uniqueness check and collide at the database level.
    """

    def __init__(self, **kwargs):
        kwargs.setdefault("max_length", 32)
        kwargs.setdefault(
            "help_text", "Unique stock keeping unit. Stored uppercase."
        )
        super().__init__(**kwargs)

    def to_internal_value(self, data):
        return normalize_sku(super().to_internal_value(data))