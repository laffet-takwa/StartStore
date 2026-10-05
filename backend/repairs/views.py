"""Repair endpoints."""

from __future__ import annotations

from drf_spectacular.utils import OpenApiParameter, extend_schema
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from common.permissions import IsAdmin, IsManager, IsTechnician
from repairs.constants import RepairStatus
from repairs.models import Repair, RepairImage, RepairPart, RepairStatusHistory
from repairs.serializers import (
    RepairPartCreateSerializer,
    RepairSerializer,
    RepairStatusUpdateSerializer,
    RepairWriteSerializer,
)
from repairs.services import add_part, change_status, _get_employee_from_request


REPAIR_FILTER_PARAMETERS = [
    OpenApiParameter("status", str, description="Filter by repair status."),
    OpenApiParameter("technician", str, description="Filter by technician id."),
    OpenApiParameter("search", str, description="Search by ticket number, customer or serial number."),
    OpenApiParameter("created_after", str, description="Filter by creation date (gte)."),
    OpenApiParameter("created_before", str, description="Filter by creation date (lt)."),
    OpenApiParameter("ordering", str, description="Ordering field."),
]


class RepairViewSet(viewsets.ModelViewSet):
    queryset = Repair.objects.all()
    filterset_fields = ["status"]
    search_fields = ["ticket_number", "customer__first_name", "customer__last_name", "device__serial_number"]
    ordering_fields = ["created_at", "status", "estimated_cost", "final_cost"]
    ordering = ["-created_at"]
    http_method_names = ["get", "post", "patch", "delete", "head", "options"]

    def get_permissions(self):
        if self.action in ("create", "update", "partial_update", "destroy"):
            self.permission_classes = [IsAdmin | IsManager | IsTechnician]
        else:
            self.permission_classes = [IsAdmin | IsManager | IsTechnician | IsSales]
        return super().get_permissions()

    def get_queryset(self):
        qs = super().get_queryset().select_related(
            "customer", "device", "technician"
        ).prefetch_related("images", "parts", "status_history")
        return qs

    def get_serializer_class(self):
        if self.action in ("create",):
            return RepairWriteSerializer
        if self.action == "change_status":
            return RepairStatusUpdateSerializer
        if self.action == "add_part":
            return RepairPartCreateSerializer
        return RepairSerializer

    @extend_schema(
        tags=["repairs"],
        summary="List repairs",
        parameters=REPAIR_FILTER_PARAMETERS,
        responses={200: RepairSerializer(many=True)},
    )
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)

    @extend_schema(
        tags=["repairs"],
        summary="Create a repair",
        request=RepairWriteSerializer,
        responses={201: RepairSerializer},
    )
    def create(self, request, *args, **kwargs):
        return super().create(request, *args, **kwargs)

    @extend_schema(
        tags=["repairs"],
        summary="Update a repair",
        request=RepairWriteSerializer,
        responses={200: RepairSerializer},
    )
    def partial_update(self, request, *args, **kwargs):
        return super().partial_update(request, *args, **kwargs)

    @extend_schema(
        tags=["repairs"],
        summary="Change repair status",
        request=RepairStatusUpdateSerializer,
        responses={200: RepairSerializer},
    )
    @action(detail=True, methods=["patch"])
    def change_status(self, request, pk=None):
        repair = self.get_object()
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        employee = _get_employee_from_request(request)
        repair = change_status(
            repair=repair,
            new_status=serializer.validated_data["status"],
            employee=employee,
            note=serializer.validated_data.get("note", ""),
            diagnosis=serializer.validated_data.get("diagnosis"),
            repair_solution=serializer.validated_data.get("repair_solution"),
            final_cost=serializer.validated_data.get("final_cost"),
            internal_notes=serializer.validated_data.get("internal_notes"),
        )
        return Response(RepairSerializer(repair).data)

    @extend_schema(
        tags=["repairs"],
        summary="Assign technician",
        request={"application/json": {"type": "object", "properties": {"technician_id": {"type": "string"}}}},
        responses={200: RepairSerializer},
    )
    @action(detail=True, methods=["patch"])
    def assign(self, request, pk=None):
        repair = self.get_object()
        technician_id = request.data.get("technician_id")
        if technician_id is None:
            return Response({"detail": "technician_id is required."}, status=status.HTTP_400_BAD_REQUEST)
        from employees.models import Employee
        try:
            technician = Employee.objects.get(pk=technician_id, is_active=True)
        except Employee.DoesNotExist:
            return Response({"detail": "Technician not found."}, status=status.HTTP_404_NOT_FOUND)
        repair.technician = technician
        repair.save(update_fields=["technician", "updated_at"])
        return Response(RepairSerializer(repair).data)

    @extend_schema(
        tags=["repairs"],
        summary="Add part to repair",
        request=RepairPartCreateSerializer,
        responses={201: RepairPartSerializer},
    )
    @action(detail=True, methods=["post"])
    def add_part(self, request, pk=None):
        repair = self.get_object()
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        employee = _get_employee_from_request(request)
        from products.models import Product
        try:
            product = Product.objects.get(pk=serializer.validated_data["product_id"])
        except Product.DoesNotExist:
            return Response({"detail": "Product not found."}, status=status.HTTP_404_NOT_FOUND)
        part = add_part(
            repair=repair,
            product=product,
            quantity=serializer.validated_data["quantity"],
            unit_price=serializer.validated_data["unit_price"],
            employee=employee,
        )
        return Response(RepairPartSerializer(part).data, status=status.HTTP_201_CREATED)

    @extend_schema(
        tags=["repairs"],
        summary="Mark repair as complete",
        request=None,
        responses={200: RepairSerializer},
    )
    @action(detail=True, methods=["post"])
    def complete(self, request, pk=None):
        repair = self.get_object()
        employee = _get_employee_from_request(request)
        repair = change_status(
            repair=repair,
            new_status=RepairStatus.TESTING,
            employee=employee,
            note="Marked as complete",
        )
        return Response(RepairSerializer(repair).data)

    @extend_schema(
        tags=["repairs"],
        summary="Mark repair as delivered",
        request=None,
        responses={200: RepairSerializer},
    )
    @action(detail=True, methods=["post"])
    def deliver(self, request, pk=None):
        repair = self.get_object()
        employee = _get_employee_from_request(request)
        repair = change_status(
            repair=repair,
            new_status=RepairStatus.DELIVERED,
            employee=employee,
            note="Delivered to customer",
        )
        return Response(RepairSerializer(repair).data)

    @extend_schema(
        tags=["repairs"],
        summary="Get repair status history",
        responses={200: RepairStatusHistorySerializer(many=True)},
    )
    @action(detail=True, methods=["get"])
    def history(self, request, pk=None):
        repair = self.get_object()
        history = repair.status_history.all()
        serializer = RepairStatusHistorySerializer(history, many=True)
        return Response(serializer.data)

    @extend_schema(
        tags=["repairs"],
        summary="List repair parts",
        responses={200: RepairPartSerializer(many=True)},
    )
    @action(detail=True, methods=["get"])
    def parts(self, request, pk=None):
        repair = self.get_object()
        parts = repair.parts.all()
        serializer = RepairPartSerializer(parts, many=True)
        return Response(serializer.data)

    @extend_schema(
        tags=["repairs"],
        summary="List repair images",
        responses={200: RepairImageSerializer(many=True)},
    )
    @action(detail=True, methods=["get"])
    def images(self, request, pk=None):
        repair = self.get_object()
        images = repair.images.all()
        serializer = RepairImageSerializer(images, many=True)
        return Response(serializer.data)
