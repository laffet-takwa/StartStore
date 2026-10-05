"""Device endpoints."""

from __future__ import annotations

from drf_spectacular.utils import OpenApiParameter, extend_schema
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from common.permissions import IsAdmin, IsManager, IsSales, IsTechnician, is_admin
from devices.models import Device
from devices.serializers import DeviceSerializer, DeviceWriteSerializer


DEVICE_FILTER_PARAMETERS = [
    OpenApiParameter("customer", str, description="Filter by customer id."),
    OpenApiParameter("device_type", str, description="Filter by device type."),
    OpenApiParameter("brand", str, description="Filter by brand."),
    OpenApiParameter("serial_number", str, description="Filter by serial number."),
    OpenApiParameter("search", str, description="Search by brand, model or serial number."),
    OpenApiParameter("ordering", str, description="Ordering field."),
]


class DeviceViewSet(viewsets.ModelViewSet):
    queryset = Device.objects.all()
    filterset_fields = ["customer", "device_type", "brand", "serial_number"]
    search_fields = ["brand", "model", "serial_number", "accessories"]
    ordering_fields = ["created_at", "device_type", "brand", "model"]
    ordering = ["-created_at"]
    http_method_names = ["get", "post", "patch", "delete", "head", "options"]

    def get_permissions(self):
        if self.action in ("create", "update", "partial_update", "destroy"):
            self.permission_classes = [IsAdmin | IsManager | IsSales]
        else:
            self.permission_classes = [IsAdmin | IsManager | IsTechnician | IsSales]
        return super().get_permissions()

    def get_queryset(self):
        return super().get_queryset().select_related("customer")

    def get_serializer_class(self):
        if self.action in ("create", "update", "partial_update"):
            return DeviceWriteSerializer
        return DeviceSerializer

    @extend_schema(
        tags=["devices"],
        summary="List devices",
        parameters=DEVICE_FILTER_PARAMETERS,
        responses={200: DeviceSerializer(many=True)},
    )
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)

    @extend_schema(
        tags=["devices"],
        summary="Create a device",
        request=DeviceWriteSerializer,
        responses={201: DeviceSerializer},
    )
    def create(self, request, *args, **kwargs):
        return super().create(request, *args, **kwargs)

    @extend_schema(
        tags=["devices"],
        summary="Update a device",
        request=DeviceWriteSerializer,
        responses={200: DeviceSerializer},
    )
    def partial_update(self, request, *args, **kwargs):
        return super().partial_update(request, *args, **kwargs)

    @extend_schema(
        tags=["devices"],
        summary="Delete a device",
        request=None,
        responses={204: None},
    )
    def destroy(self, request, *args, **kwargs):
        return super().destroy(request, *args, **kwargs)
