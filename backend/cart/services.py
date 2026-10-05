"""Cart business logic.

All mutations funnel through :class:`CartService` so the availability rules are
applied identically whether a line is added by the API, a management command or
a future "wishlist -> cart" feature. Checkout reuses
:func:`collect_cart_issues`, which keeps cart validation and order validation
from drifting apart.
"""

from __future__ import annotations

from dataclasses import dataclass
from decimal import Decimal

from django.conf import settings
from django.db import transaction

from cart.exceptions import (
    CartItemUnavailableError,
    CartNotFoundError,
    InsufficientStockError,
    InvalidQuantityError,
    UnavailableProductsError,
)
from cart.models import Cart, CartItem
from products.models import Product

CENTS = Decimal("0.01")

#: Reason codes attached to a :class:`CartIssue`.
REASON_INACTIVE = "product_inactive"
REASON_OUT_OF_STOCK = "out_of_stock"
REASON_INSUFFICIENT_STOCK = "insufficient_stock"
REASON_QUANTITY_EXCEEDED = "quantity_exceeded"


@dataclass(frozen=True, slots=True)
class CartIssue:
    """A single reason why a cart line cannot be purchased."""

    product_id: int
    product_name: str
    reason: str
    requested: int
    available: int

    def as_dict(self) -> dict:
        return {
            "product_id": self.product_id,
            "product_name": self.product_name,
            "reason": self.reason,
            "requested_quantity": self.requested,
            "available_quantity": self.available,
        }


def max_cart_quantity() -> int:
    """Maximum units allowed in one cart line."""
    return getattr(settings, "STARTSTORE_CART_ITEM_MAX_QUANTITY", 99)


def collect_cart_issues(items) -> list[CartIssue]:
    """Return every reason the given cart lines could not be purchased."""
    issues: list[CartIssue] = []
    for item in items:
        product = item.product
        if not product.is_active:
            issues.append(
                CartIssue(
                    product_id=product.id,
                    product_name=product.name,
                    reason=REASON_INACTIVE,
                    requested=item.quantity,
                    available=0,
                )
            )
        elif product.stock == 0:
            issues.append(
                CartIssue(
                    product_id=product.id,
                    product_name=product.name,
                    reason=REASON_OUT_OF_STOCK,
                    requested=item.quantity,
                    available=0,
                )
            )
        elif product.stock < item.quantity:
            issues.append(
                CartIssue(
                    product_id=product.id,
                    product_name=product.name,
                    reason=REASON_INSUFFICIENT_STOCK,
                    requested=item.quantity,
                    available=product.stock,
                )
            )
    return issues


class CartService:
    """Stateless cart operations. All methods expect an authenticated user."""

    # --- Retrieval ----------------------------------------------------------- #
    @staticmethod
    def get_or_create(user) -> Cart:
        """Return the user's cart, creating an empty one on first access."""
        cart, _ = Cart.objects.get_or_create(user=user)
        return cart

    @staticmethod
    def get_for_update(user) -> Cart:
        """Return the user's cart holding a row lock (effective on PostgreSQL)."""
        cart = Cart.objects.select_for_update().filter(user=user).first()
        if cart is None:
            cart = Cart.objects.create(user=user)
        return cart

    @staticmethod
    def get_item_or_404(cart: Cart, item_id) -> CartItem:
        """Fetch a cart line scoped to the owning cart.

        Scoping the query (rather than adding a permission check afterwards)
        means a customer probing another cart's ids receives 404, not 403.
        """
        item = (
            CartItem.objects.select_related("product", "cart")
            .filter(cart=cart, pk=item_id)
            .first()
        )
        if item is None:
            raise CartNotFoundError()
        return item

    # --- Mutations ----------------------------------------------------------- #
    @staticmethod
    def add_item(cart: Cart, product: Product, quantity) -> CartItem:
        """Add a product, or top up the existing line for the same product."""
        quantity = _validate_quantity(quantity)

        if not product.is_active:
            raise CartItemUnavailableError(
                f"'{product.name}' is no longer available.",
                details={"product_id": product.id, "reason": REASON_INACTIVE},
            )

        item = cart.items.select_related("product").filter(product=product).first()
        new_quantity = quantity if item is None else item.quantity + quantity

        if new_quantity > max_cart_quantity():
            raise InvalidQuantityError(
                f"A single line cannot hold more than {max_cart_quantity()} units.",
                details={
                    "product_id": product.id,
                    "reason": REASON_QUANTITY_EXCEEDED,
                    "maximum": max_cart_quantity(),
                },
            )
        _assert_stock(product, new_quantity)

        with transaction.atomic():
            if item is None:
                item = CartItem.objects.create(cart=cart, product=product, quantity=quantity)
            else:
                item.quantity = new_quantity
                item.save(update_fields=["quantity", "updated_at"])

        CartService.touch(cart)
        return item

    @staticmethod
    def set_quantity(cart: Cart, item: CartItem, quantity) -> CartItem:
        """Replace the line quantity."""
        quantity = _validate_quantity(quantity)
        product = item.product

        if not product.is_active:
            raise CartItemUnavailableError(
                f"'{product.name}' is no longer available.",
                details={"product_id": product.id, "reason": REASON_INACTIVE},
            )
        _assert_stock(product, quantity)

        item.quantity = quantity
        item.save(update_fields=["quantity", "updated_at"])
        CartService.touch(cart)
        return item

    @staticmethod
    def remove_item(cart: Cart, item: CartItem) -> None:
        item.delete()
        CartService.touch(cart)

    @staticmethod
    def clear(cart: Cart) -> int:
        """Delete every line; returns how many were removed."""
        removed, _ = cart.items.all().delete()
        CartService.touch(cart)
        return removed

    # --- Shared validation --------------------------------------------------- #
    @staticmethod
    def assert_purchasable(items) -> None:
        """Raise when any line cannot be purchased as configured."""
        issues = collect_cart_issues(items)
        if not issues:
            return
        stock_issues = [issue for issue in issues if issue.reason != REASON_INACTIVE]
        if stock_issues:
            raise InsufficientStockError([issue.as_dict() for issue in stock_issues])
        raise UnavailableProductsError([issue.as_dict() for issue in issues])

    @staticmethod
    def touch(cart: Cart) -> None:
        """Bump ``updated_at`` so carts can be sorted by recent activity."""
        cart.save(update_fields=["updated_at"])


def _validate_quantity(quantity) -> int:
    if isinstance(quantity, bool) or not isinstance(quantity, (int, str)):
        raise InvalidQuantityError("Quantity must be a whole number.")
    try:
        parsed = int(quantity)
    except (TypeError, ValueError):
        raise InvalidQuantityError("Quantity must be a whole number.") from None
    if parsed < 1:
        raise InvalidQuantityError("Quantity must be greater than 0.")
    if parsed > max_cart_quantity():
        raise InvalidQuantityError(
            f"A single line cannot hold more than {max_cart_quantity()} units.",
            details={
                "reason": REASON_QUANTITY_EXCEEDED,
                "maximum": max_cart_quantity(),
            },
        )
    return parsed


def _assert_stock(product: Product, quantity: int) -> None:
    if product.stock < quantity:
        raise InsufficientStockError(
            [
                CartIssue(
                    product_id=product.id,
                    product_name=product.name,
                    reason=REASON_INSUFFICIENT_STOCK,
                    requested=quantity,
                    available=product.stock,
                ).as_dict()
            ]
        )