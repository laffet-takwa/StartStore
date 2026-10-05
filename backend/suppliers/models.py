"""Supplier models."""

from __future__ import annotations

import uuid

from django.db import models


class SupplierQuerySet(models.QuerySet):
    def active(self):
        return self.filter(is_active=True)


class Supplier(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    contact_person = models.CharField(max_length=255, null=True, blank=True)
    phone = models.CharField(max_length=30, null=True, blank=True)
    email = models.EmailField(max_length=255, null=True, blank=True)
    address = models.TextField(null=True, blank=True)
    city = models.CharField(max_length=100, null=True, blank=True)
    notes = models.TextField(null=True, blank=True)
    is_active = models.BooleanField(default=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = SupplierQuerySet.as_manager()

    class Meta:
        db_table = "suppliers"
        ordering = ("name",)
        indexes = [
            models.Index(fields=["name"], name="supplier_name_idx"),
            models.Index(fields=["is_active"], name="supplier_active_idx"),
        ]

    def __str__(self) -> str:
        return self.name
