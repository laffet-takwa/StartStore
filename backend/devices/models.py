"""Device models."""

from __future__ import annotations

import uuid

from django.db import models

from customers.models import Customer


class DeviceQuerySet(models.QuerySet):
    def for_customer(self, customer):
        return self.filter(customer=customer)

    def with_last_repair(self):
        return self.select_related("last_repair")


class Device(models.Model):
    """A customer device brought in for service or sale."""

    DEVICE_TYPES = [
        ("laptop", "Laptop"),
        ("desktop", "Desktop"),
        ("tablet", "Tablet"),
        ("printer", "Printer"),
        ("server", "Server"),
        ("phone", "Phone"),
        ("other", "Other"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    customer = models.ForeignKey(
        Customer,
        on_delete=models.CASCADE,
        related_name="devices",
    )
    device_type = models.CharField(max_length=20, choices=DEVICE_TYPES, default="other", db_index=True)
    brand = models.CharField(max_length=150, null=True, blank=True)
    model = models.CharField(max_length=150, null=True, blank=True)
    serial_number = models.CharField(max_length=255, null=True, blank=True, db_index=True)
    device_password = models.TextField(null=True, blank=True)
    accessories = models.TextField(null=True, blank=True)
    physical_condition = models.TextField(null=True, blank=True)
    notes = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = DeviceQuerySet.as_manager()

    class Meta:
        db_table = "customer_devices"
        ordering = ("-created_at",)
        indexes = [
            models.Index(fields=["customer", "device_type"], name="device_customer_type_idx"),
            models.Index(fields=["serial_number"], name="device_serial_idx"),
        ]

    def __str__(self) -> str:
        return f"{self.get_device_type_display()} - {self.brand} {self.model}".strip()
