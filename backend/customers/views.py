"""Customer endpoints."""

from __future__ import annotations

from drf_spectacular.utils import OpenApiParameter, extend_schema
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from common.permissions import IsAdmin, IsManager, IsSales
from customers.models import Customer
from customers.serializers import CustomerSerializer, CustomerWriteSerializer


CUSTOMER_FILTER_PARAMETERS = [
    OpenApiParameter("search", str, description="Search by name, phone or email."),
    OpenApiParameter("customer_type", str, description="Filter by customer type."),
    OpenApiParameter("is_active", bool, description="Filter by active status."),
    OpenApiParameter("ordering", str, description="Ordering field."),
]


class CustomerViewSet(viewsets.ModelViewSet):
    queryset = Customer.objects.all()
    permission_classes = [IsAdmin | IsManager | IsSales]
    filterset_fields = ["customer_type", "is_active"]
    search_fields = ["first_name", "last_name", "phone", "email", "company_name"]
    ordering_fields = ["created_at", "first_name", "last_name", "phone"]
    ordering = ["-created_at"]
    http_method_names = ["get", "post", "patch", "delete", "head", "options"]

    def get_queryset(self):
        return super().get_queryset()

    def get_serializer_class(self):
        if self.action in ("create", "update", "partial_update"):
            return CustomerWriteSerializer
        return CustomerSerializer

    @extend_schema(
        tags=["customers"],
        summary="List customers",
        parameters=CUSTOMER_FILTER_PARAMETERS,
        responses={200: CustomerSerializer(many=True)},
    )
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)

    @extend_schema(
        tags=["customers"],
        summary="Create a customer",
        request=CustomerWriteSerializer,
        responses={201: CustomerSerializer},
    )
    def create(self, request, *args, **kwargs):
        return super().create(request, *args, **kwargs)

    @extend_schema(
        tags=["customers"],
        summary="Update a customer",
        request=CustomerWriteSerializer,
        responses={200: CustomerSerializer},
    )
    def partial_update(self, request, *args, **kwargs):
        return super().partial_update(request, *args, **kwargs)

    @extend_schema(
        tags=["customers"],
        summary="Deactivate a customer",
        description="Soft delete. The row survives so historic records keep their references.",
        request=None,
        responses={204: None},
    )
    def destroy(self, request, *args, **kwargs):
        customer = self.get_object()
        customer.is_active = False
        customer.save(update_fields=["is_active", "updated_at"])
        return Response(status=status.HTTP_204_NO_CONTENT)
