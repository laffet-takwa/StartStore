"""Cart domain exceptions."""

from __future__ import annotations

from rest_framework import status

from common.exceptions import APIError, BusinessRuleError


class InvalidQuantityError(BusinessRuleError):
    """The requested quantity is not a positive whole number within limits."""

    default_code = "invalid_quantity"
    default_detail = "Quantity must be a whole number greater than 0."


class CartItemUnavailableError(BusinessRuleError):
    """The requested product cannot be added to or kept in the cart."""

    default_code = "product_unavailable"
    default_detail = "This product is not available in the requested quantity."


class InsufficientStockError(BusinessRuleError):
    """The cart holds more units than the store can fulfil."""

    default_code = "insufficient_stock"
    default_detail = "One or more cart items exceed the available stock."

    def __init__(self, issues: list[dict] | None = None) -> None:
        super().__init__(
            "One or more items do not have enough stock to fulfil the order.",
            details={"items": issues or []},
        )


class UnavailableProductsError(BusinessRuleError):
    """At least one cart line was deactivated or delisted."""

    default_code = "product_unavailable"
    default_detail = "One or more items in your cart are no longer available."

    def __init__(self, issues: list[dict] | None = None) -> None:
        super().__init__(
            self.default_detail, details={"items": issues or []}
        )


class EmptyCartError(BusinessRuleError):
    """Checkout was attempted with nothing in the cart."""

    default_code = "empty_cart"
    default_detail = "Your cart is empty."


class CartNotFoundError(APIError):
    """The referenced cart line does not belong to the requester."""

    status_code = status.HTTP_404_NOT_FOUND
    default_code = "cart_item_not_found"
    default_detail = "Cart item not found."