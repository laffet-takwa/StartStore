"""Notification endpoints."""

from __future__ import annotations

from drf_spectacular.utils import OpenApiParameter, extend_schema
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from common.permissions import IsAdmin, IsManager, IsTechnician, IsSales
from notifications.models import Notification
from notifications.serializers import NotificationMarkReadSerializer, NotificationSerializer


NOTIFICATION_FILTER_PARAMETERS = [
    OpenApiParameter("is_read", bool, description="Filter by read status."),
    OpenApiParameter("type", str, description="Filter by notification type."),
    OpenApiParameter("ordering", str, description="Ordering field."),
]


class NotificationViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Notification.objects.all()
    filterset_fields = ["is_read", "type"]
    ordering_fields = ["created_at", "type"]
    ordering = ["-created_at"]
    http_method_names = ["get", "post", "head", "options"]

    def get_permissions(self):
        self.permission_classes = [IsAdmin | IsManager | IsTechnician | IsSales]
        return super().get_permissions()

    def get_queryset(self):
        employee = None
        if self.request.user and self.request.user.is_authenticated:
            try:
                from employees.models import Employee
                employee = Employee.objects.get(profile=self.request.user)
            except Exception:
                pass
        if employee:
            return super().get_queryset().filter(employee=employee)
        return Notification.objects.none()

    def get_serializer_class(self):
        if self.action in ("mark_read", "mark_all_read"):
            return NotificationMarkReadSerializer
        return NotificationSerializer

    @extend_schema(
        tags=["notifications"],
        summary="List notifications",
        parameters=NOTIFICATION_FILTER_PARAMETERS,
        responses={200: NotificationSerializer(many=True)},
    )
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)

    @extend_schema(
        tags=["notifications"],
        summary="Mark notification as read",
        request=NotificationMarkReadSerializer,
        responses={200: NotificationSerializer},
    )
    @action(detail=True, methods=["post"])
    def mark_read(self, request, pk=None):
        notification = self.get_object()
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        notification.is_read = serializer.validated_data["is_read"]
        notification.save(update_fields=["is_read"])
        return Response(NotificationSerializer(notification).data)

    @extend_schema(
        tags=["notifications"],
        summary="Mark all notifications as read",
        request=None,
        responses={200: {"type": "object", "properties": {"count": {"type": "integer"}}}},
    )
    @action(detail=False, methods=["post"])
    def mark_all_read(self, request, *args, **kwargs):
        queryset = self.get_queryset().filter(is_read=False)
        count = queryset.update(is_read=True)
        return Response({"count": count})
