"""Employee models."""

from __future__ import annotations

import uuid

from django.db import models

from accounts.models import Profile
from common.validators import validate_phone_number


class EmployeeQuerySet(models.QuerySet):
    def active(self):
        return self.filter(is_active=True)

    def with_profile(self):
        return self.select_related("profile")


class Employee(models.Model):
    """An employee record linked to an auth profile."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    profile = models.OneToOneField(
        Profile,
        on_delete=models.CASCADE,
        related_name="employee",
        help_text="The auth profile for this employee.",
    )
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    email = models.EmailField(max_length=255, unique=True)
    phone = models.CharField(
        max_length=32, null=True, blank=True, default=None, validators=[validate_phone_number]
    )
    role = models.CharField(
        max_length=20,
        choices=[
            ("admin", "Admin"),
            ("manager", "Manager"),
            ("technician", "Technician"),
            ("sales", "Sales"),
        ],
        default="sales",
        db_index=True,
    )
    avatar_url = models.TextField(null=True, blank=True)
    is_active = models.BooleanField(default=True, db_index=True)
    hire_date = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = EmployeeQuerySet.as_manager()

    class Meta:
        db_table = "employees"
        ordering = ("-created_at",)
        indexes = [
            models.Index(fields=["role", "is_active"], name="employee_role_active_idx"),
            models.Index(fields=["email"], name="employee_email_idx"),
        ]

    def __str__(self) -> str:
        return f"{self.first_name} {self.last_name}"

    @property
    def full_name(self) -> str:
        return f"{self.first_name} {self.last_name}"

    def save(self, *args, **kwargs) -> None:
        self.email = self.email.strip().lower()
        if self.phone == "":
            self.phone = None
        super().save(*args, **kwargs)
