"""Invoice models."""

from __future__ import annotations

import uuid
from decimal import Decimal

from django.db import models

from customers.models import Customer
from sales.models import Sale
from repairs.models import Repair
from common.constants import PaymentStatus

ZERO = Decimal("0.00")


class InvoiceQuerySet(models.QuerySet):
    def for_customer(self, customer):
        return self.filter(customer=customer)

    def paid(self):
        return self.filter(payment_status=PaymentStatus.PAID)


class Invoice(models.Model):
    INVOICE_TYPES = [
        ("sale", "Sale"),
        ("repair", "Repair"),
        ("proforma", "Proforma"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    invoice_number = models.CharField(max_length=50, unique=True, editable=False)
    customer = models.ForeignKey(
        Customer,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="invoices",
    )
    sale = models.ForeignKey(
        Sale,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="invoices",
    )
    repair = models.ForeignKey(
        Repair,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="invoices",
    )
    subtotal = models.DecimalField(max_digits=12, decimal_places=2, default=ZERO)
    discount = models.DecimalField(max_digits=12, decimal_places=2, default=ZERO)
    tax = models.DecimalField(max_digits=12, decimal_places=2, default=ZERO)
    total = models.DecimalField(max_digits=12, decimal_places=2, default=ZERO)
    payment_status = models.CharField(
        max_length=20,
        choices=PaymentStatus.choices,
        default=PaymentStatus.PENDING,
        db_index=True,
    )
    issued_at = models.DateTimeField(auto_now_add=True)
    notes = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now=True)

    objects = InvoiceQuerySet.as_manager()

    class Meta:
        db_table = "invoices"
        ordering = ("-issued_at",)
        indexes = [
            models.Index(fields=["customer", "-issued_at"], name="invoice_customer_issued_idx"),
            models.Index(fields=["invoice_number"], name="invoice_number_idx"),
            models.Index(fields=["payment_status"], name="invoice_payment_status_idx"),
        ]
        constraints = [
            models.CheckConstraint(condition=models.Q(subtotal__gte=0), name="invoice_subtotal_non_negative"),
            models.CheckConstraint(condition=models.Q(discount__gte=0), name="invoice_discount_non_negative"),
            models.CheckConstraint(condition=models.Q(tax__gte=0), name="invoice_tax_non_negative"),
            models.CheckConstraint(condition=models.Q(total__gte=0), name="invoice_total_non_negative"),
        ]

    def __str__(self) -> str:
        return self.invoice_number

    def save(self, *args, **kwargs) -> None:
        if not self.invoice_number:
            from django.utils import timezone
            date_part = timezone.now().strftime("%Y%m%d")
            unique_part = uuid.uuid4().hex[:6].upper()
            self.invoice_number = f"INV-{date_part}-{unique_part}"
        super().save(*args, **kwargs)
