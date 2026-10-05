"""Employee endpoints."""

from __future__ import annotations

from drf_spectacular.utils import OpenApiParameter, extend_schema
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from common.permissions import IsAdmin, IsManager
from employees.models import Employee
from employees.serializers import EmployeeSerializer, EmployeeWriteSerializer


EMPLOYEE_FILTER_PARAMETERS = [
    OpenApiParameter("role", str, description="Filter by role."),
    OpenApiParameter("search", str, description="Search by name or email."),
    OpenApiParameter("is_active", bool, description="Filter by active status."),
    OpenApiParameter("ordering", str, description="Ordering field."),
]


class EmployeeViewSet(viewsets.ModelViewSet):
    queryset = Employee.objects.all()
    permission_classes = [IsAdmin]
    filterset_fields = ["role", "is_active"]
    search_fields = ["first_name", "last_name", "email", "phone"]
    ordering_fields = ["created_at", "first_name", "last_name", "email", "role"]
    ordering = ["-created_at"]
    http_method_names = ["get", "post", "patch", "delete", "head", "options"]

    def get_queryset(self):
        return super().get_queryset().with_profile()

    def get_serializer_class(self):
        if self.action in ("create", "update", "partial_update"):
            return EmployeeWriteSerializer
        return EmployeeSerializer

    @extend_schema(
        tags=["employees"],
        summary="List employees",
        parameters=EMPLOYEE_FILTER_PARAMETERS,
        responses={200: EmployeeSerializer(many=True)},
    )
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)

    @extend_schema(
        tags=["employees"],
        summary="Create an employee",
        request=EmployeeWriteSerializer,
        responses={201: EmployeeSerializer},
    )
    def create(self, request, *args, **kwargs):
        return super().create(request, *args, **kwargs)

    @extend_schema(
        tags=["employees"],
        summary="Update an employee",
        request=EmployeeWriteSerializer,
        responses={200: EmployeeSerializer},
    )
    def partial_update(self, request, *args, **kwargs):
        return super().partial_update(request, *args, **kwargs)

    @extend_schema(
        tags=["employees"],
        summary="Deactivate an employee",
        description="Soft delete. The row survives so historic records keep their references.",
        request=None,
        responses={204: None},
    )
    def destroy(self, request, *args, **kwargs):
        employee = self.get_object()
        employee.is_active = False
        employee.save(update_fields=["is_active", "updated_at"])
        return Response(status=status.HTTP_204_NO_CONTENT)
