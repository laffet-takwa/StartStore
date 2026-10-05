"""Field level validators shared across apps."""

from __future__ import annotations

import re

from django.core.exceptions import ValidationError
from django.utils.text import slugify

#: Permissive international phone format: optional +, 7-20 digits with common
#: separators. Store specific rules belong to the payment/SMS provider.
PHONE_PATTERN = re.compile(r"^\+?[0-9](?:[0-9\s\-().]{5,18}[0-9])$")

SKU_PATTERN = re.compile(r"^[A-Z0-9][A-Z0-9\-_]{1,31}$")


def validate_phone_number(value: str) -> None:
    """Validate an E.164-ish phone number."""
    if not value:
        return
    if not PHONE_PATTERN.match(value.strip()):
        raise ValidationError(
            "Enter a valid phone number, e.g. +15551234567.",
            code="invalid_phone",
            params={"value": value},
        )


def normalize_phone_number(value: str) -> str:
    """Collapse internal whitespace so stored values stay comparable."""
    return re.sub(r"\s+", " ", value.strip()) if value else value


def normalize_sku(value: str) -> str:
    """Uppercase and collapse whitespace of a SKU."""
    return re.sub(r"\s+", "", value.strip().upper()) if value else value


def validate_sku(value: str) -> None:
    """Validate the normalised SKU shape."""
    if not value:
        return
    if not SKU_PATTERN.match(value):
        raise ValidationError(
            "SKU may only contain letters, digits, hyphen and underscore "
            "(2-32 characters).",
            code="invalid_sku",
            params={"value": value},
        )


def validate_slug(value: str) -> None:
    """Ensure a slug only contains URL safe characters."""
    if value != slugify(value):
        raise ValidationError(
            "Use lowercase letters, numbers, hyphens and underscores only.",
            code="invalid_slug",
            params={"value": value},
        )


def validate_non_negative(value) -> None:
    """Reject negative money/quantity values at the model level."""
    if value is not None and value < 0:
        raise ValidationError("Value cannot be negative.", code="negative")