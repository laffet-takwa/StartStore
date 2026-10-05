"""Sales models."""

from __future__ import annotations

import uuid
from decimal import Decimal

from django.db import models

from customers.models import Customer
from employees.models import Employee
from common.constants import PaymentStatus
from common.validators import validate_phone_number

ZERO = Decimal("0.00")


class SaleQuerySet(models.QuerySet):
    def for_customer(self, customer):
        return self.filter(customer=customer)

    def paid(self):
        return self.filter(payment_status=PaymentStatus.PAID)

    def open(self):
        return self.exclude(status="cancelled")


class Sale(models.Model):
    SALE_STATUSES = [
        ("draft", "Draft"),
        ("confirmed", "Confirmed"),
        ("cancelled", "Cancelled"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    sale_number = models.CharField(max_length=50, unique=True, editable=False)
    customer = models.ForeignKey(
        Customer,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="sales",
    )
    employee = models.ForeignKey(
        Employee,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="sales",
    )
    subtotal = models.DecimalField(max_digits=12, decimal_places=2, default=ZERO)
    discount = models.DecimalField(max_digits=12, decimal_places=2, default=ZERO)
    tax = models.DecimalField(max_digits=12, decimal_places=2, default=ZERO)
    total = models.DecimalField(max_digits=12, decimal_places=2, default=ZERO)
    status = models.CharField(max_length=20, choices=SALE_STATUSES, default="draft", db_index=True)
    payment_status = models.CharField(
        max_length=20,
        choices=PaymentStatus.choices,
        default=PaymentStatus.PENDING,
        db_index=True,
    )
    notes = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = SaleQuerySet.as_manager()

    class Meta:
        db_table = "sales"
        ordering = ("-created_at",)
        indexes = [
            models.Index(fields=["customer", "-created_at"], name="sale_customer_created_idx"),
            models.Index(fields=["status", "-created_at"], name="sale_status_created_idx"),
            models.Index(fields=["sale_number"], name="sale_number_idx"),
        ]
        constraints = [
            models.CheckConstraint(condition=models.Q(subtotal__gte=0), name="sale_subtotal_non_negative"),
            models.CheckConstraint(condition=models.Q(discount__gte=0), name="sale_discount_non_negative"),
            models.CheckConstraint(condition=models.Q(tax__gte=0), name="sale_tax_non_negative"),
            models.CheckConstraint(condition=models.Q(total__gte=0), name="sale_total_non_negative"),
        ]

    def __str__(self) -> str:
        return self.sale_number

    def save(self, *args, **kwargs) -> None:
        if not self.sale_number:
            from django.utils import timezone
            date_part = timezone.now().strftime("%Y%m%d")
            unique_part = uuid.uuid4().hex[:6].upper()
            self.sale_number = f"SALE-{date_part}-{unique_part}"
        super().save(*args, **kwargs)


class SaleItem(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    sale = models.ForeignKey(Sale, on_delete=models.CASCADE, related_name="items")
    product = models.ForeignKey(
        "products.Product",
        on_delete=models.PROTECT,
        related_name="sale_items",
    )
    quantity = models.IntegerField()
    unit_price = models.DecimalField(max_digits=12, decimal_places=2)
    discount = models.DecimalField(max_digits=12, decimal_places=2, default=ZERO)
    total_price = models.DecimalField(max_digits=14, decimal_places=2, editable=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "sale_items"
        ordering = ("id",)
        constraints = [
            models.CheckConstraint(condition=models.Q(quantity__gt=0), name="sale_item_quantity_positive"),
            models.CheckConstraint(condition=models.Q(unit_price__gte=0), name="sale_item_unit_price_non_negative"),
            models.CheckConstraint(condition=models.Q(discount__gte=0), name="sale_item_discount_non_negative"),
        ]

    def __str__(self) -> str:
        return f"{self.quantity} x {self.product.name}"

    def save(self, *args, **kwargs) -> None:
        self.total_price = (self.quantity * self.unit_price) - self.discount
        super().save(*args, **kwargs)
