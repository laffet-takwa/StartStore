"""Cart models (``public.carts`` and ``public.cart_items``).

The schema has no unique constraint on ``(cart_id, product_id)``, so
idempotency for "add this product again" is enforced in
:class:`cart.services.CartService` rather than by the database.
"""

from __future__ import annotations

import uuid
from decimal import Decimal

from django.conf import settings
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models

from accounts.models import Profile
from products.models import Product

CENTS = Decimal("0.01")


def _max_cart_quantity() -> int:
    return getattr(settings, "STARTSTORE_CART_ITEM_MAX_QUANTITY", 99)


class Cart(models.Model):
    """A profile's shopping cart. One per profile, enforced by ``user_id`` UNIQUE."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(Profile, on_delete=models.CASCADE, related_name="cart")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "carts"
        ordering = ("-updated_at",)

    def __str__(self) -> str:
        return f"Cart #{self.pk} ({self.user.email})"

    # --- Derived values ------------------------------------------------------ #
    @property
    def total_items(self) -> int:
        return sum(item.quantity for item in self.items.all())

    @property
    def subtotal(self) -> Decimal:
        return sum((item.line_total for item in self.items.all()), Decimal("0.00")).quantize(CENTS)


class CartItem(models.Model):
    """One product line inside a cart."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    cart = models.ForeignKey(Cart, on_delete=models.CASCADE, related_name="items")
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name="cart_items")
    quantity = models.IntegerField(
        default=1, validators=[MinValueValidator(1), MaxValueValidator(_max_cart_quantity())]
    )
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "cart_items"
        ordering = ("created_at", "id")

    def __str__(self) -> str:
        return f"{self.quantity} x {self.product.name}"

    # --- Derived values ------------------------------------------------------ #
    @property
    def unit_price(self) -> Decimal:
        return self.product.final_price

    @property
    def line_total(self) -> Decimal:
        return (self.product.final_price * self.quantity).quantize(CENTS)

    @property
    def is_available(self) -> bool:
        return self.product.is_active and self.product.stock >= self.quantity

    @property
    def available_quantity(self) -> int:
        return self.product.stock if self.product.is_active else 0
