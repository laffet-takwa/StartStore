"""Payment models."""

from __future__ import annotations

import uuid

from django.db import models

from sales.models import Sale
from repairs.models import Repair


class PaymentQuerySet(models.QuerySet):
    def for_sale(self, sale):
        return self.filter(sale=sale)

    def for_repair(self, repair):
        return self.filter(repair=repair)


class Payment(models.Model):
    PAYMENT_METHODS = [
        ("cash", "Cash"),
        ("card", "Card"),
        ("bank_transfer", "Bank Transfer"),
        ("mobile", "Mobile"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    sale = models.ForeignKey(
        Sale,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="payments",
    )
    repair = models.ForeignKey(
        Repair,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="payments",
    )
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    payment_method = models.CharField(max_length=50, choices=PAYMENT_METHODS)
    reference = models.CharField(max_length=255, null=True, blank=True)
    notes = models.TextField(null=True, blank=True)
    paid_at = models.DateTimeField(auto_now_add=True)
    created_at = models.DateTimeField(auto_now=True)

    objects = PaymentQuerySet.as_manager()

    class Meta:
        db_table = "payments"
        ordering = ("-paid_at",)
        indexes = [
            models.Index(fields=["sale", "-paid_at"], name="payment_sale_paid_idx"),
            models.Index(fields=["repair", "-paid_at"], name="payment_repair_paid_idx"),
        ]
        constraints = [
            models.CheckConstraint(
                condition=models.Q(sale__isnull=False, repair__isnull=True)
                | models.Q(sale__isnull=True, repair__isnull=False),
                name="payment_parent_check",
            )
        ]

    def __str__(self) -> str:
        parent = self.sale or self.repair
        return f"Payment {self.amount} for {parent}"
