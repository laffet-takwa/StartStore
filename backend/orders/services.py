"""Order and checkout business logic.

The single most important rule in StartStore lives here: **totals are always
recomputed on the server from the database**. Nothing in a checkout request body
can influence what a customer is charged.

``orders`` has no ``currency`` column, so the configured store currency is used
for display only; the stored figures are bare decimals.
"""

from __future__ import annotations

import secrets
from dataclasses import dataclass
from decimal import Decimal, ROUND_HALF_UP

from django.conf import settings
from django.db import transaction
from django.db.models import F
from django.utils import timezone

from cart.exceptions import EmptyCartError
from cart.models import CartItem
from cart.services import CartService
from common.constants import (
    CANCELLABLE_ORDER_STATUSES,
    ORDER_STATUS_TRANSITIONS,
    RESTOCK_ON_CANCEL_STATUSES,
    OrderStatus,
    PaymentStatus,
    can_transition,
)
from orders.exceptions import InvalidStatusTransitionError, OrderNotCancellableError
from orders.models import Order, OrderItem
from products.models import Product

CENTS = Decimal("0.01")
ZERO = Decimal("0.00")

#: How many times to retry a colliding order number before giving up.
ORDER_NUMBER_ATTEMPTS = 5


def money(value) -> Decimal:
    """Quantise to two decimal places using half-up rounding."""
    return Decimal(value).quantize(CENTS, rounding=ROUND_HALF_UP)


def generate_order_number() -> str:
    """Human readable, collision resistant order reference."""
    stamp = timezone.now().strftime("%Y%m%d")
    return f"SS-{stamp}-{secrets.token_hex(3).upper()}"


@dataclass(frozen=True, slots=True)
class OrderTotals:
    """Server computed money for one checkout."""

    subtotal: Decimal
    shipping_cost: Decimal
    total: Decimal


class ShippingService:
    """Flat rate shipping with a free-shipping threshold."""

    @staticmethod
    def cost_for(subtotal: Decimal) -> Decimal:
        threshold = settings.STARTSTORE_FREE_SHIPPING_THRESHOLD
        if threshold and subtotal >= Decimal(str(threshold)):
            return ZERO
        return money(settings.STARTSTORE_SHIPPING_FLAT_RATE)

    @staticmethod
    def qualifies_for_free_shipping(subtotal: Decimal) -> bool:
        threshold = settings.STARTSTORE_FREE_SHIPPING_THRESHOLD
        return bool(threshold) and subtotal >= Decimal(str(threshold))


@dataclass(frozen=True, slots=True)
class CheckoutLine:
    """A priced cart line, ready to become an order item."""

    item: CartItem
    product_id: object
    product_name: str
    unit_price: Decimal
    quantity: int
    subtotal: Decimal


class CheckoutService:
    """Turns a cart into an order atomically."""

    @classmethod
    def execute(cls, *, user, shipping_address: dict) -> Order:
        """Validate the cart, price it on the server and create the order.

        The whole flow runs inside one transaction: either the order, its items,
        the stock decrements and the cart cleanup all commit, or none of them do.
        """
        with transaction.atomic():
            cart = CartService.get_for_update(user)
            items = list(
                CartItem.objects.filter(cart=cart)
                .select_related("product")
                .order_by("product_id")
            )

            if not items:
                raise EmptyCartError()

            # Reuse the cart rules so validation cannot drift between screens.
            CartService.assert_purchasable(items)

            lines = [cls._price_line(item) for item in items]
            totals = cls._totals(lines)

            order = Order.objects.create(
                user=user,
                order_number=cls._unique_order_number(),
                status=OrderStatus.PENDING,
                payment_status=PaymentStatus.PENDING,
                subtotal=totals.subtotal,
                shipping_cost=totals.shipping_cost,
                total=totals.total,
                shipping_address=shipping_address,
            )

            OrderItem.objects.bulk_create(
                [
                    OrderItem(
                        order=order,
                        product_id=line.product_id,
                        product_name=line.product_name,
                        unit_price=line.unit_price,
                        quantity=line.quantity,
                        subtotal=line.subtotal,
                    )
                    for line in lines
                ]
            )

            cls._decrement_stock(lines)
            CartService.clear(cart)
            return order

    # --- Internals ----------------------------------------------------------- #
    @staticmethod
    def _price_line(item: CartItem) -> CheckoutLine:
        product = item.product
        unit_price = money(product.final_price)
        return CheckoutLine(
            item=item,
            product_id=product.id,
            product_name=product.name,
            unit_price=unit_price,
            quantity=item.quantity,
            subtotal=money(unit_price * item.quantity),
        )

    @staticmethod
    def _totals(lines: list[CheckoutLine]) -> OrderTotals:
        subtotal = money(sum((line.subtotal for line in lines), ZERO))
        shipping_cost = ShippingService.cost_for(subtotal)
        return OrderTotals(
            subtotal=subtotal, shipping_cost=shipping_cost, total=money(subtotal + shipping_cost)
        )

    @staticmethod
    def _decrement_stock(lines: list[CheckoutLine]) -> None:
        """Decrement with a compare-and-set so concurrent checkouts cannot oversell."""
        from common.exceptions import ResourceConflictError

        for line in lines:
            updated = (
                Product.objects.filter(
                    pk=line.product_id, stock__gte=line.quantity, is_active=True
                )
                .update(stock=F("stock") - line.quantity)
            )
            if updated:
                continue

            # Another checkout consumed the stock between validation and here.
            available = (
                Product.objects.filter(pk=line.product_id)
                .values_list("stock", flat=True)
                .first()
                or 0
            )
            raise ResourceConflictError(
                f"'{line.product_name}' went out of stock while you were checking out.",
                code="stock_conflict",
                status_code=409,
                details={
                    "items": [
                        {
                            "product_id": str(line.product_id),
                            "product_name": line.product_name,
                            "reason": "stock_conflict",
                            "requested_quantity": line.quantity,
                            "available_quantity": available,
                        }
                    ]
                },
            )

    @staticmethod
    def _unique_order_number() -> str:
        for _ in range(ORDER_NUMBER_ATTEMPTS):
            candidate = generate_order_number()
            if not Order.objects.filter(order_number=candidate).exists():
                return candidate
        return f"SS-{timezone.now():%Y%m%d}-{secrets.token_hex(8).upper()}"


class OrderService:
    """Order lifecycle operations shared by the customer and admin APIs."""

    @classmethod
    def cancel(cls, order: Order, *, restock: bool = True) -> Order:
        """Cancel an order, returning reserved stock when applicable."""
        with transaction.atomic():
            order = Order.objects.select_for_update().get(pk=order.pk)

            if order.status not in CANCELLABLE_ORDER_STATUSES:
                raise OrderNotCancellableError(
                    f"An order that is '{order.get_status_display()}' cannot be cancelled."
                )

            if restock and order.status in RESTOCK_ON_CANCEL_STATUSES:
                cls._restock(order)

            order.status = OrderStatus.CANCELLED
            if order.payment_status == PaymentStatus.PAID:
                order.payment_status = PaymentStatus.REFUNDED
            order.save(update_fields=["status", "payment_status", "updated_at"])
            return order

    @classmethod
    def transition(
        cls, order: Order, new_status: str, *, payment_status: str | None = None
    ) -> Order:
        """Move an order along the fulfilment state machine."""
        with transaction.atomic():
            order = Order.objects.select_for_update().get(pk=order.pk)

            if new_status != order.status and not can_transition(order.status, new_status):
                raise InvalidStatusTransitionError(
                    f"An order cannot move from '{order.get_status_display()}' "
                    f"to '{dict(OrderStatus.choices).get(new_status, new_status)}'.",
                    details={
                        "current_status": order.status,
                        "requested_status": new_status,
                        "allowed": sorted(
                            ORDER_STATUS_TRANSITIONS.get(order.status, frozenset())
                        ),
                    },
                )
            order.status = new_status

            if payment_status is not None and payment_status != order.payment_status:
                order.payment_status = payment_status

            order.save(update_fields=["status", "payment_status", "updated_at"])
            return order

    @staticmethod
    def _restock(order: Order) -> None:
        """Return every still-linked line to stock."""
        for item in order.items.filter(product__isnull=False):
            Product.objects.filter(pk=item.product_id).update(
                stock=F("stock") + item.quantity
            )