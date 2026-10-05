"""Account related enumerations."""

from __future__ import annotations

from django.db import models


class UserRole(models.TextChoices):
    CUSTOMER = "customer", "Customer"
    ADMIN = "admin", "Admin"
    MANAGER = "manager", "Manager"
    TECHNICIAN = "technician", "Technician"
    SALES = "sales", "Sales"
