"""Order models (``public.orders`` and ``public.order_items``).

Notes on matching the live schema:

* There is **no ``currency`` column** - money is a bare ``numeric``, so the
  configured store currency is a presentation concern, not a stored one.
* ``order_items`` has **no ``sku``** and no timestamps; the snapshot columns are
  ``product_name``, ``unit_price``, ``quantity`` and ``subtotal``.
* ``product_id`` is nullable, so a deleted product leaves the line intact and
  only drops the reference.
"""

from __future__ import annotations

import uuid
from decimal import Decimal

from django.core.validators import MinValueValidator
from django.db import models

from accounts.models import Profile
from common.constants import CANCELLABLE_ORDER_STATUSES, OrderStatus, PaymentStatus
from products.models import Product

CENTS = Decimal("0.01")
ZERO = Decimal("0.00")


class OrderQuerySet(models.QuerySet):
    def for_user(self, user):
        return self.filter(user=user)

    def paid(self):
        return self.filter(payment_status=PaymentStatus.PAID)

    def open(self):
        return self.exclude(status__in=[OrderStatus.DELIVERED, OrderStatus.CANCELLED])


class Order(models.Model):
    """A placed order."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(Profile, on_delete=models.CASCADE, related_name="orders")
    order_number = models.CharField(max_length=32, unique=True)
    status = models.CharField(
        max_length=20, choices=OrderStatus.choices, default=OrderStatus.PENDING, db_index=True
    )
    payment_status = models.CharField(
        max_length=20, choices=PaymentStatus.choices, default=PaymentStatus.PENDING, db_index=True
    )
    subtotal = models.DecimalField(max_digits=12, decimal_places=2, default=ZERO)
    shipping_cost = models.DecimalField(max_digits=12, decimal_places=2, default=ZERO)
    total = models.DecimalField(max_digits=12, decimal_places=2, default=ZERO)
    shipping_address = models.JSONField()
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = OrderQuerySet.as_manager()

    class Meta:
        db_table = "orders"
        ordering = ("-created_at",)
        indexes = [
            models.Index(fields=["user", "-created_at"], name="order_user_created_idx"),
            models.Index(fields=["status", "-created_at"], name="order_status_created_idx"),
        ]
        constraints = [
            models.CheckConstraint(
                condition=models.Q(subtotal__gte=0), name="order_subtotal_non_negative"
            ),
            models.CheckConstraint(
                condition=models.Q(shipping_cost__gte=0), name="order_shipping_non_negative"
            ),
            models.CheckConstraint(
                condition=models.Q(total__gte=0), name="order_total_non_negative"
            ),
        ]

    def __str__(self) -> str:
        return self.order_number

    @property
    def item_count(self) -> int:
        return sum(item.quantity for item in self.items.all())

    @property
    def can_cancel(self) -> bool:
        return self.status in CANCELLABLE_ORDER_STATUSES

    @property
    def next_statuses(self) -> list[str]:
        """Statuses an admin may move this order to right now."""
        from common.constants import ORDER_STATUS_TRANSITIONS

        return sorted(ORDER_STATUS_TRANSITIONS.get(self.status, frozenset()))


class OrderItem(models.Model):
    """One purchased line, snapshotted at checkout time."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name="items")
    product = models.ForeignKey(
        Product,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="order_items",
        help_text="Reference only. Historical facts live in the snapshot columns.",
    )
    product_name = models.CharField(
        max_length=200, help_text="Snapshot of the product name at purchase time."
    )
    unit_price = models.DecimalField(
        max_digits=12, decimal_places=2, help_text="Snapshot of the charged unit price."
    )
    quantity = models.IntegerField(validators=[MinValueValidator(1)])
    subtotal = models.DecimalField(max_digits=14, decimal_places=2)

    class Meta:
        db_table = "order_items"
        ordering = ("id",)
        constraints = [
            models.CheckConstraint(
                condition=models.Q(quantity__gt=0), name="order_item_quantity_positive"
            ),
            models.CheckConstraint(
                condition=models.Q(unit_price__gte=0), name="order_item_unit_price_non_negative"
            ),
            models.CheckConstraint(
                condition=models.Q(subtotal__gte=0), name="order_item_subtotal_non_negative"
            ),
        ]

    def __str__(self) -> str:
        return f"{self.quantity} x {self.product_name}"
