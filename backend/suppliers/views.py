"""Supplier endpoints."""

from __future__ import annotations

from drf_spectacular.utils import OpenApiParameter, extend_schema
from rest_framework import status, viewsets
from rest_framework.response import Response

from common.permissions import IsAdmin, IsManager, IsSales
from suppliers.models import Supplier
from suppliers.serializers import SupplierSerializer, SupplierWriteSerializer


SUPPLIER_FILTER_PARAMETERS = [
    OpenApiParameter("search", str, description="Search by name or email."),
    OpenApiParameter("is_active", bool, description="Filter by active status."),
    OpenApiParameter("ordering", str, description="Ordering field."),
]


class SupplierViewSet(viewsets.ModelViewSet):
    queryset = Supplier.objects.all()
    filterset_fields = ["is_active"]
    search_fields = ["name", "email", "phone", "city"]
    ordering_fields = ["created_at", "name", "city"]
    ordering = ["name"]
    http_method_names = ["get", "post", "patch", "delete", "head", "options"]

    def get_permissions(self):
        if self.action in ("create", "update", "partial_update", "destroy"):
            self.permission_classes = [IsAdmin | IsManager]
        else:
            self.permission_classes = [IsAdmin | IsManager | IsSales]
        return super().get_permissions()

    def get_serializer_class(self):
        if self.action in ("create", "update", "partial_update"):
            return SupplierWriteSerializer
        return SupplierSerializer

    @extend_schema(
        tags=["suppliers"],
        summary="List suppliers",
        parameters=SUPPLIER_FILTER_PARAMETERS,
        responses={200: SupplierSerializer(many=True)},
    )
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)

    @extend_schema(
        tags=["suppliers"],
        summary="Create a supplier",
        request=SupplierWriteSerializer,
        responses={201: SupplierSerializer},
    )
    def create(self, request, *args, **kwargs):
        return super().create(request, *args, **kwargs)

    @extend_schema(
        tags=["suppliers"],
        summary="Update a supplier",
        request=SupplierWriteSerializer,
        responses={200: SupplierSerializer},
    )
    def partial_update(self, request, *args, **kwargs):
        return super().partial_update(request, *args, **kwargs)

    @extend_schema(
        tags=["suppliers"],
        summary="Delete a supplier",
        request=None,
        responses={204: None},
    )
    def destroy(self, request, *args, **kwargs):
        supplier = self.get_object()
        supplier.is_active = False
        supplier.save(update_fields=["is_active", "updated_at"])
        return Response(status=status.HTTP_204_NO_CONTENT)
