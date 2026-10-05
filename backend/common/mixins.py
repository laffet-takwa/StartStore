"""Reusable view mixins."""

from __future__ import annotations

from rest_framework import mixins
from rest_framework.viewsets import GenericViewSet

from common.permissions import is_admin


class PublicReadAdminWriteQuerysetMixin:
    """Hide inactive rows from anonymous and customer requests.

    Combined with :class:`common.permissions.IsAdminOrReadOnly` this implements
    the catalogue rule "public users read active rows only, admins manage all".
    Set :attr:`managed_field` to the soft-delete flag on the model.
    """

    managed_field: str = "is_active"

    def get_queryset(self):
        queryset = super().get_queryset()
        if not is_admin(getattr(self.request, "user", None)):
            return queryset.filter(**{self.managed_field: True})
        return queryset


class ReadOnlyModelViewSet(
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    GenericViewSet,
):
    """Convenience base for catalogue-like read-only endpoints."""
