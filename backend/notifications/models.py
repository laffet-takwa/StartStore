"""Notification models."""

from __future__ import annotations

import uuid

from django.db import models

from employees.models import Employee


class NotificationQuerySet(models.QuerySet):
    def for_employee(self, employee):
        return self.filter(employee=employee)

    def unread(self):
        return self.filter(is_read=False)


class Notification(models.Model):
    NOTIFICATION_TYPES = [
        ("low_stock", "Low Stock"),
        ("repair_ready", "Repair Ready"),
        ("repair_waiting_customer", "Repair Waiting Customer"),
        ("payment_pending", "Payment Pending"),
        ("new_task", "New Task"),
        ("system", "System"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    employee = models.ForeignKey(
        Employee,
        on_delete=models.CASCADE,
        related_name="notifications",
    )
    title = models.CharField(max_length=255)
    message = models.TextField()
    type = models.CharField(max_length=50, choices=NOTIFICATION_TYPES, db_index=True)
    is_read = models.BooleanField(default=False, db_index=True)
    reference_type = models.CharField(max_length=50, null=True, blank=True)
    reference_id = models.UUIDField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    objects = NotificationQuerySet.as_manager()

    class Meta:
        db_table = "notifications"
        ordering = ("-created_at",)
        indexes = [
            models.Index(fields=["employee", "is_read", "-created_at"], name="notification_employee_read_created_idx"),
        ]

    def __str__(self) -> str:
        return f"{self.title} - {self.employee.full_name}"
