"""Repair models."""

from __future__ import annotations

import uuid
from decimal import Decimal

from django.db import models
from django.db.models import Q

from customers.models import Customer
from devices.models import Device
from employees.models import Employee
from repairs.constants import RepairStatus, can_transition
from common.validators import validate_phone_number

ZERO = Decimal("0.00")


class RepairQuerySet(models.QuerySet):
    def active(self):
        return self.exclude(status__in=[RepairStatus.DELIVERED, RepairStatus.CANCELLED])

    def for_customer(self, customer):
        return self.filter(customer=customer)

    def for_technician(self, technician):
        return self.filter(technician=technician)


class Repair(models.Model):
    """A repair ticket."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    ticket_number = models.CharField(max_length=50, unique=True, editable=False)
    customer = models.ForeignKey(
        Customer,
        on_delete=models.PROTECT,
        related_name="repairs",
    )
    device = models.ForeignKey(
        Device,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="repairs",
    )
    technician = models.ForeignKey(
        Employee,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="assigned_repairs",
    )
    problem_description = models.TextField()
    diagnosis = models.TextField(null=True, blank=True)
    repair_solution = models.TextField(null=True, blank=True)
    internal_notes = models.TextField(null=True, blank=True)
    status = models.CharField(
        max_length=20,
        choices=RepairStatus.choices,
        default=RepairStatus.RECEIVED,
        db_index=True,
    )
    estimated_cost = models.DecimalField(max_digits=12, decimal_places=2, default=ZERO)
    final_cost = models.DecimalField(max_digits=12, decimal_places=2, default=ZERO)
    estimated_completion_date = models.DateField(null=True, blank=True)
    received_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    delivered_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = RepairQuerySet.as_manager()

    class Meta:
        db_table = "repair_tickets"
        ordering = ("-created_at",)
        indexes = [
            models.Index(fields=["customer", "-created_at"], name="repair_customer_created_idx"),
            models.Index(fields=["technician", "status"], name="repair_tech_status_idx"),
            models.Index(fields=["status", "-created_at"], name="repair_status_created_idx"),
            models.Index(fields=["ticket_number"], name="repair_ticket_idx"),
        ]
        constraints = [
            models.CheckConstraint(
                condition=Q(estimated_cost__gte=0), name="repair_estimated_cost_non_negative"
            ),
            models.CheckConstraint(
                condition=Q(final_cost__gte=0), name="repair_final_cost_non_negative"
            ),
        ]

    def __str__(self) -> str:
        return self.ticket_number

    def save(self, *args, **kwargs) -> None:
        if not self.ticket_number:
            from django.utils import timezone
            date_part = timezone.now().strftime("%Y%m%d")
            unique_part = uuid.uuid4().hex[:6].upper()
            self.ticket_number = f"REP-{date_part}-{unique_part}"
        super().save(*args, **kwargs)


class RepairImage(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    repair = models.ForeignKey(
        Repair,
        on_delete=models.CASCADE,
        related_name="images",
    )
    image_url = models.TextField()
    description = models.CharField(max_length=255, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "repair_images"
        ordering = ("created_at",)


class RepairPart(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    repair = models.ForeignKey(
        Repair,
        on_delete=models.CASCADE,
        related_name="parts",
    )
    product = models.ForeignKey(
        "products.Product",
        on_delete=models.PROTECT,
        related_name="repair_parts",
    )
    quantity = models.IntegerField(default=1)
    unit_price = models.DecimalField(max_digits=12, decimal_places=2, default=ZERO)
    total_price = models.DecimalField(max_digits=14, decimal_places=2, editable=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "repair_parts"
        ordering = ("created_at",)
        constraints = [
            models.CheckConstraint(
                condition=Q(quantity__gt=0), name="repair_part_quantity_positive"
            ),
            models.CheckConstraint(
                condition=Q(unit_price__gte=0), name="repair_part_unit_price_non_negative"
            ),
        ]

    def __str__(self) -> str:
        return f"{self.product.name} x{self.quantity}"

    def save(self, *args, **kwargs) -> None:
        self.total_price = self.quantity * self.unit_price
        super().save(*args, **kwargs)


class RepairStatusHistory(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    repair = models.ForeignKey(
        Repair,
        on_delete=models.CASCADE,
        related_name="status_history",
    )
    old_status = models.CharField(
        max_length=20, choices=RepairStatus.choices, null=True, blank=True
    )
    new_status = models.CharField(max_length=20, choices=RepairStatus.choices)
    changed_by = models.ForeignKey(
        Employee,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="repair_status_changes",
    )
    note = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "repair_status_history"
        ordering = ("-created_at",)
        indexes = [
            models.Index(fields=["repair", "-created_at"], name="repair_history_repair_created_idx"),
        ]

    def __str__(self) -> str:
        return f"{self.repair.ticket_number}: {self.old_status or 'new'} -> {self.new_status}"
