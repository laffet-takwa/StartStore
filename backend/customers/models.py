"""Customer models."""

from __future__ import annotations

import uuid

from django.db import models

from accounts.models import Profile
from common.validators import validate_phone_number


class CustomerQuerySet(models.QuerySet):
    def active(self):
        return self.filter(is_active=True)

    def with_devices(self):
        return self.prefetch_related("devices")

    def with_repairs(self):
        return self.prefetch_related("repairs")


class Customer(models.Model):
    """A customer record, independent of auth profiles."""

    CUSTOMER_TYPES = [
        ("individual", "Individual"),
        ("business", "Business"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    profile = models.OneToOneField(
        Profile,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="customer_record",
        help_text="Optional link to an auth profile for account holders.",
    )
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100, null=True, blank=True)
    phone = models.CharField(max_length=30, validators=[validate_phone_number])
    email = models.EmailField(max_length=255, null=True, blank=True)
    company_name = models.CharField(max_length=255, null=True, blank=True)
    address = models.TextField(null=True, blank=True)
    city = models.CharField(max_length=100, null=True, blank=True)
    governorate = models.CharField(max_length=100, null=True, blank=True)
    postal_code = models.CharField(max_length=20, null=True, blank=True)
    notes = models.TextField(null=True, blank=True)
    customer_type = models.CharField(
        max_length=20, choices=CUSTOMER_TYPES, default="individual", db_index=True
    )
    is_active = models.BooleanField(default=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = CustomerQuerySet.as_manager()

    class Meta:
        db_table = "customers"
        ordering = ("-created_at",)
        indexes = [
            models.Index(fields=["phone"], name="customer_phone_idx"),
            models.Index(fields=["email"], name="customer_email_idx"),
            models.Index(fields=["is_active", "customer_type"], name="customer_active_type_idx"),
        ]

    def __str__(self) -> str:
        return f"{self.first_name} {self.last_name or ''}".strip()

    def save(self, *args, **kwargs) -> None:
        self.phone = self.phone.strip()
        if self.email:
            self.email = self.email.strip().lower()
        super().save(*args, **kwargs)
