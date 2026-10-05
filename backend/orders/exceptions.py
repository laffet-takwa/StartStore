"""Order domain exceptions."""

from __future__ import annotations

from rest_framework import status

from common.exceptions import APIError, BusinessRuleError, ResourceConflictError


class OrderNotFoundError(APIError):
    """The order does not exist, or does not belong to the requester."""

    status_code = status.HTTP_404_NOT_FOUND
    default_code = "order_not_found"
    default_detail = "Order not found."


class OrderNotCancellableError(ResourceConflictError):
    """The order has progressed past the point where it can be cancelled."""

    default_code = "order_not_cancellable"
    default_detail = "This order can no longer be cancelled."


class InvalidStatusTransitionError(BusinessRuleError):
    """An admin tried to move an order to a status it cannot reach."""

    default_code = "invalid_status_transition"
    default_detail = "This status change is not allowed from the current order status."


class CheckoutError(BusinessRuleError):
    """Base class for checkout failures."""

    default_code = "checkout_failed"
    default_detail = "Checkout could not be completed."