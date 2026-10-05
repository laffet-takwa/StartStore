"""Consistent error handling for the whole API.

Every failing response is rendered as a single envelope::

    {
      "error": {
        "code": "validation_error",
        "message": "Request validation failed.",
        "details": {"quantity": ["Ensure this value is greater than 0."]}
      }
    }

Clients only ever need to branch on ``error.code``; ``error.message`` is safe
to show to end users and ``error.details`` is for form level feedback.
"""

from __future__ import annotations

import logging
from typing import Any

from django.core.exceptions import PermissionDenied as DjangoPermissionDenied
from django.core.exceptions import ValidationError as DjangoValidationError
from django.http import Http404
from rest_framework import status
from rest_framework.exceptions import APIException, ValidationError
from rest_framework.response import Response
from rest_framework.views import exception_handler as drf_exception_handler

logger = logging.getLogger("startstore.errors")

#: Fallback codes keyed by HTTP status when an exception carries no better one.
_CODE_BY_STATUS: dict[int, str] = {
    status.HTTP_400_BAD_REQUEST: "bad_request",
    status.HTTP_401_UNAUTHORIZED: "not_authenticated",
    status.HTTP_403_FORBIDDEN: "permission_denied",
    status.HTTP_404_NOT_FOUND: "not_found",
    status.HTTP_405_METHOD_NOT_ALLOWED: "method_not_allowed",
    status.HTTP_406_NOT_ACCEPTABLE: "not_acceptable",
    status.HTTP_409_CONFLICT: "conflict",
    status.HTTP_415_UNSUPPORTED_MEDIA_TYPE: "unsupported_media_type",
    status.HTTP_429_TOO_MANY_REQUESTS: "throttled",
    status.HTTP_500_INTERNAL_SERVER_ERROR: "internal_server_error",
}

#: DRF stores an exception's code on ``exc.detail``, not on the exception, so
#: codes originating inside a third-party package are normalised here. That
#: keeps the public contract stable if SimpleJWT renames its own error codes.
_CODE_ALIASES = {
    "no_active_account": "invalid_credentials",
    "token_blacklisted": "token_revoked",
    "token_not_valid": "invalid_token",
    "user_not_found": "invalid_credentials",
}

_MESSAGE_BY_CODE: dict[str, str] = {
    "validation_error": "Request validation failed.",
    "bad_request": "The request could not be processed.",
    "not_authenticated": "Authentication credentials were not provided or are invalid.",
    "authentication_failed": "Authentication credentials were not provided or are invalid.",
    "permission_denied": "You do not have permission to perform this action.",
    "not_found": "The requested resource does not exist.",
    "method_not_allowed": "This HTTP method is not allowed for this endpoint.",
    "not_acceptable": "This content type is not supported by this endpoint.",
    "conflict": "The resource is not in a state that allows this operation.",
    "unsupported_media_type": "The supplied media type is not supported.",
    "throttled": "Request throttled. Please retry later.",
    "internal_server_error": "An unexpected error occurred.",
}


class APIError(APIException):
    """Base class for every error raised by StartStore business logic."""

    status_code = status.HTTP_400_BAD_REQUEST
    default_code = "api_error"
    default_detail = "The request could not be processed."

    def __init__(
        self,
        message: str | None = None,
        *,
        code: str | None = None,
        details: Any = None,
        status_code: int | None = None,
    ) -> None:
        self.message = message or self.default_detail
        self.code = code or self.default_code
        self.details = details
        if status_code is not None:
            self.status_code = status_code
        super().__init__(self.message, code=self.code)


class BusinessRuleError(APIError):
    """A domain invariant rejected the request (HTTP 400)."""

    status_code = status.HTTP_400_BAD_REQUEST
    default_code = "business_rule_violation"
    default_detail = "The request violates a business rule."


class ResourceConflictError(APIError):
    """The resource exists or is in a state that conflicts (HTTP 409)."""

    status_code = status.HTTP_409_CONFLICT
    default_code = "conflict"
    default_detail = "The resource is not in a state that allows this operation."


def _normalise(value: Any) -> Any:
    """Convert DRF ``ErrorDetail`` trees into plain JSON friendly values."""
    if isinstance(value, dict):
        return {str(key): _normalise(item) for key, item in value.items()}
    if isinstance(value, (list, tuple)):
        return [_normalise(item) for item in value]
    if isinstance(value, (str, int, float, bool)) or value is None:
        return str(value) if isinstance(value, str) else value
    return str(value)


def _resolve_code(exc: BaseException, response: Response) -> str:
    if isinstance(exc, (ValidationError, DjangoValidationError)):
        return "validation_error"
    if isinstance(exc, Http404):
        return "not_found"
    if isinstance(exc, DjangoPermissionDenied):
        return "permission_denied"

    # DRF's APIException keeps the code on the ErrorDetail inside `detail`.
    explicit = getattr(exc, "code", None) or getattr(getattr(exc, "detail", None), "code", None)
    if explicit and str(explicit) not in {"error", "detail"}:
        return _CODE_ALIASES.get(str(explicit), str(explicit))

    return _CODE_BY_STATUS.get(response.status_code, "error")


def _resolve_message(exc: BaseException, code: str, response: Response) -> str:
    custom = getattr(exc, "message", None)
    if isinstance(custom, str) and custom:
        return custom
    return _MESSAGE_BY_CODE.get(code, _MESSAGE_BY_CODE["bad_request"])


def _resolve_details(exc: BaseException) -> Any:
    details = getattr(exc, "details", None)
    if isinstance(exc, ValidationError):
        details = exc.detail
    elif isinstance(exc, DjangoValidationError):
        details = exc.message_dict if hasattr(exc, "message_dict") else exc.messages
    elif details is None and not isinstance(exc, APIError):
        detail = getattr(exc, "detail", None)
        if detail is not None and not isinstance(detail, (str, bytes)):
            details = detail

    normalised = _normalise(details) if details is not None else None
    if isinstance(normalised, (dict, list)) and normalised:
        return normalised
    return None


def api_exception_handler(exc: BaseException, context: dict) -> Response | None:
    """DRF ``EXCEPTION_HANDLER`` producing the StartStore error envelope."""
    if isinstance(exc, DjangoValidationError):
        exc = ValidationError(detail=getattr(exc, "message_dict", None) or exc.messages)

    response = drf_exception_handler(exc, context)
    if response is None:
        if isinstance(exc, DjangoPermissionDenied):
            response = Response(status=status.HTTP_403_FORBIDDEN)
        else:
            logger.exception("Unhandled exception in API view", exc_info=exc)
            return None

    code = _resolve_code(exc, response)
    message = _resolve_message(exc, code, response)
    details = _resolve_details(exc)

    body: dict[str, Any] = {"code": code, "message": message}
    if details is not None:
        body["details"] = details

    response.data = {"error": body}
    return response