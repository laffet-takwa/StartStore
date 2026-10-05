"""Wishlist serializers."""

from __future__ import annotations

from rest_framework import serializers

from products.serializers import ProductSummarySerializer
from wishlist.models import Wishlist


class WishlistSerializer(serializers.ModelSerializer):
    """A saved product, read representation.

    Entries are created and removed exclusively through
    ``POST /api/wishlist/toggle/`` and ``DELETE /api/wishlist/{product_id}/``,
    so no write fields are exposed here.
    """

    product = ProductSummarySerializer(read_only=True)
    product_id = serializers.UUIDField(read_only=True)

    class Meta:
        model = Wishlist
        fields = ("id", "product", "product_id", "created_at")
        read_only_fields = ("id", "product", "product_id", "created_at")


class WishlistToggleSerializer(serializers.Serializer):
    """Body of ``POST /api/wishlist/toggle/``."""

    product_id = serializers.UUIDField(help_text="Id of the product to toggle.")


class WishlistToggleResultSerializer(serializers.Serializer):
    """Result of a toggle, so the frontend needs no follow-up request."""

    in_wishlist = serializers.BooleanField()
    product_id = serializers.UUIDField()
    count = serializers.IntegerField()