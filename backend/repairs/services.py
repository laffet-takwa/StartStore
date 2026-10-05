"""Repair services."""

from __future__ import annotations

from decimal import Decimal
from typing import Sequence

from django.db import transaction
from django.db.models import F
from django.utils import timezone

from employees.models import Employee
from products.models import Product
from repairs.constants import RepairStatus, REPAIR_STATUS_TRANSITIONS, can_transition
from repairs.models import Repair, RepairPart, RepairStatusHistory
from common.exceptions import BusinessRuleError


class RepairStatusTransitionError(BusinessRuleError):
    default_code = "invalid_status_transition"
    default_detail = "This repair status transition is not allowed."


def _get_employee_from_request(request) -> Employee | None:
    profile = getattr(request, "user", None)
    if profile and getattr(profile, "is_authenticated", False):
        try:
            return Employee.objects.get(profile=profile)
        except Employee.DoesNotExist:
            return None
    return None


def change_status(repair: Repair, new_status: str, employee: Employee | None, note: str = "", **kwargs) -> Repair:
    current = repair.status
    if not can_transition(current, new_status):
        raise RepairStatusTransitionError(
            f"Cannot transition from {current} to {new_status}.",
            code="invalid_status_transition",
        )

    old_status = repair.status
    repair.status = new_status

    for field, value in kwargs.items():
        if value is not None and hasattr(repair, field):
            setattr(repair, field, value)

    if new_status == RepairStatus.DELIVERED:
        repair.delivered_at = timezone.now()
    elif new_status == RepairStatus.CANCELLED:
        pass

    repair.save()

    RepairStatusHistory.objects.create(
        repair=repair,
        old_status=old_status,
        new_status=new_status,
        changed_by=employee,
        note=note or "Status changed",
    )
    return repair


def add_part(repair: Repair, product: Product, quantity: int, unit_price: Decimal, employee: Employee | None) -> RepairPart:
    if product.stock < quantity:
        raise BusinessRuleError(
            f"Only {product.stock} units in stock; cannot reserve {quantity}.",
            code="insufficient_stock",
        )

    with transaction.atomic():
        part = RepairPart.objects.create(
            repair=repair,
            product=product,
            quantity=quantity,
            unit_price=unit_price,
        )
        Product.objects.filter(pk=product.pk).update(stock=models.F("stock") - quantity)
        RepairStatusHistory.objects.create(
            repair=repair,
            old_status=repair.status,
            new_status=repair.status,
            changed_by=employee,
            note=f"Added part: {product.name} x{quantity}",
        )
    return part
