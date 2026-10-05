"""
Custom exception handler for consistent error responses.
"""
from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status
from django.core.exceptions import ValidationError as DjangoValidationError
from django.db import IntegrityError


def custom_exception_handler(exc, context):
    """
    Custom exception handler that returns consistent error format.
    """
    response = exception_handler(exc, context)

    if response is not None:
        # Standardize error response format
        if isinstance(response.data, dict):
            if 'detail' in response.data:
                error_response = {
                    'detail': response.data['detail'],
                    'code': getattr(exc, 'default_code', 'ERROR'),
                }
            else:
                # Handle field validation errors
                errors = []
                for field, messages in response.data.items():
                    if isinstance(messages, list):
                        for msg in messages:
                            errors.append(f"{field}: {msg}")
                    else:
                        errors.append(f"{field}: {messages}")
                error_response = {
                    'detail': 'Validation failed',
                    'code': 'VALIDATION_ERROR',
                    'errors': errors,
                }
        else:
            error_response = {
                'detail': str(response.data),
                'code': 'ERROR',
            }
        response.data = error_response

    elif isinstance(exc, DjangoValidationError):
        # Handle Django validation errors
        response = Response(
            {
                'detail': 'Validation failed',
                'code': 'VALIDATION_ERROR',
                'errors': exc.messages if hasattr(exc, 'messages') else [str(exc)],
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    elif isinstance(exc, IntegrityError):
        # Handle database integrity errors
        response = Response(
            {
                'detail': 'A database integrity error occurred. This may be due to a duplicate entry.',
                'code': 'INTEGRITY_ERROR',
            },
            status=status.HTTP_409_CONFLICT,
        )

    return response