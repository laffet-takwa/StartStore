"""Wishlist model (``public.wishlists``).

The schema has ``created_at`` only - no ``updated_at`` - and no unique
constraint on ``(user_id, product_id)``, so :meth:`Wishlist.get_or_create` in
the view provides the idempotency.
"""

from __future__ import annotations

import uuid

from django.db import models

from accounts.models import Profile
from products.models import Product


class Wishlist(models.Model):
    """A product saved by a profile for later."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(Profile, on_delete=models.CASCADE, related_name="wishlist_entries")
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name="wishlisted_by")
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        db_table = "wishlists"
        ordering = ("-created_at",)

    def __str__(self) -> str:
        return f"{self.user.email} wants {self.product.name}"
