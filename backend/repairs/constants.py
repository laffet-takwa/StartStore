"""Repair constants and state machine."""

from __future__ import annotations

from django.db import models


class RepairStatus(models.TextChoices):
    RECEIVED = "received", "Received"
    DIAGNOSIS = "diagnosis", "Diagnosis"
    WAITING_CUSTOMER = "waiting_customer", "Waiting Customer"
    APPROVED = "approved", "Approved"
    REPAIRING = "repairing", "Repairing"
    TESTING = "testing", "Testing"
    READY = "ready", "Ready"
    DELIVERED = "delivered", "Delivered"
    CANCELLED = "cancelled", "Cancelled"


REPAIR_STATUS_TRANSITIONS: dict[str, frozenset[str]] = {
    RepairStatus.RECEIVED: frozenset(
        {RepairStatus.DIAGNOSIS, RepairStatus.CANCELLED}
    ),
    RepairStatus.DIAGNOSIS: frozenset(
        {RepairStatus.WAITING_CUSTOMER, RepairStatus.REPAIRING, RepairStatus.CANCELLED}
    ),
    RepairStatus.WAITING_CUSTOMER: frozenset(
        {RepairStatus.APPROVED, RepairStatus.CANCELLED}
    ),
    RepairStatus.APPROVED: frozenset(
        {RepairStatus.REPAIRING, RepairStatus.CANCELLED}
    ),
    RepairStatus.REPAIRING: frozenset(
        {RepairStatus.TESTING, RepairStatus.CANCELLED}
    ),
    RepairStatus.TESTING: frozenset(
        {RepairStatus.REPAIRING, RepairStatus.READY}
    ),
    RepairStatus.READY: frozenset(
        {RepairStatus.DELIVERED, RepairStatus.REPAIRING}
    ),
    RepairStatus.DELIVERED: frozenset(),
    RepairStatus.CANCELLED: frozenset(),
}

REPAIR_STATUS_META: dict[str, dict] = {
    RepairStatus.RECEIVED: {"label": "Received", "colour": "bg-sky-50 text-sky-700"},
    RepairStatus.DIAGNOSIS: {"label": "Diagnosis", "colour": "bg-blue-50 text-blue-700"},
    RepairStatus.WAITING_CUSTOMER: {"label": "Waiting Customer", "colour": "bg-amber-50 text-amber-700"},
    RepairStatus.APPROVED: {"label": "Approved", "colour": "bg-indigo-50 text-indigo-700"},
    RepairStatus.REPAIRING: {"label": "Repairing", "colour": "bg-orange-50 text-orange-700"},
    RepairStatus.TESTING: {"label": "Testing", "colour": "bg-purple-50 text-purple-700"},
    RepairStatus.READY: {"label": "Ready", "colour": "bg-emerald-50 text-emerald-700"},
    RepairStatus.DELIVERED: {"label": "Delivered", "colour": "bg-zinc-100 text-zinc-700"},
    RepairStatus.CANCELLED: {"label": "Cancelled", "colour": "bg-rose-50 text-rose-700"},
}


def can_transition(current: str, target: str) -> bool:
    return target in REPAIR_STATUS_TRANSITIONS.get(current, frozenset())
