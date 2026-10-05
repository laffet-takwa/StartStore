"""Product business rules.

Kept in one place so the model layer (``Model.clean``) and the API layer
(``ProductSerializer.validate``) cannot drift apart.
"""

from __future__ import annotations

from decimal import Decimal

from django.core.exceptions import ValidationError

MINIMUM_PRICE = Decimal("0.01")


def validate_price_rules(
    *,
    price: Decimal | None,
    discount_price: Decimal | None,
) -> None:
    """Ensure the pricing pair is coherent.

    * ``price`` must be positive.
    * ``discount_price``, when present, must be positive and strictly cheaper
      than ``price`` (an "equal or greater" discount is a pricing mistake and is
      rejected instead of being silently ignored).
    """
    if price is None:
        return

    if price <= 0:
        raise ValidationError({"price": "Price must be greater than zero."}, code="invalid_price")

    if discount_price is None:
        return

    if discount_price <= 0:
        raise ValidationError(
            {"discount_price": "Discount price must be greater than zero."},
            code="invalid_discount_price",
        )
    if discount_price >= price:
        raise ValidationError(
            {"discount_price": "Discount price must be lower than the sale price."},
            code="discount_not_lower",
        )