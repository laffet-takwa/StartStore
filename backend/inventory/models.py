"""Inventory models."""

from __future__ import annotations

import uuid

from django.db import models

from products.models import Product
from employees.models import Employee


class StockMovementQuerySet(models.QuerySet):
    def for_product(self, product):
        return self.filter(product=product)


class StockMovement(models.Model):
    MOVEMENT_TYPES = [
        ("purchase", "Purchase"),
        ("sale", "Sale"),
        ("repair_usage", "Repair Usage"),
        ("return", "Return"),
        ("adjustment", "Adjustment"),
        ("damaged", "Damaged"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        related_name="inventory_movements",
    )
    movement_type = models.CharField(max_length=20, choices=MOVEMENT_TYPES, db_index=True)
    quantity = models.IntegerField()
    reference_type = models.CharField(max_length=50, null=True, blank=True)
    reference_id = models.UUIDField(null=True, blank=True)
    reason = models.TextField(null=True, blank=True)
    created_by = models.ForeignKey(
        Employee,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="inventory_movements",
    )
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    objects = StockMovementQuerySet.as_manager()

    class Meta:
        db_table = "inventory_movements"
        ordering = ("-created_at",)
        indexes = [
            models.Index(fields=["product", "-created_at"], name="inventory_product_created_idx"),
            models.Index(fields=["movement_type"], name="inventory_type_idx"),
        ]
        constraints = [
            models.CheckConstraint(
                condition=models.Q(quantity__gt=0) | models.Q(quantity__lt=0),
                name="inventory_quantity_non_zero",
            )
        ]

    def __str__(self) -> str:
        return f"{self.product.name} {self.quantity:+d} ({self.get_movement_type_display()})"
