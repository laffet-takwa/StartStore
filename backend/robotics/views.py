"""Robotics endpoints."""

from __future__ import annotations

from drf_spectacular.utils import OpenApiParameter, extend_schema
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from common.permissions import IsAdmin, IsManager, IsTechnician, IsSales
from robotics.models import RoboticsProject
from robotics.serializers import RoboticsProjectSerializer, RoboticsProjectWriteSerializer


ROBOTICS_FILTER_PARAMETERS = [
    OpenApiParameter("difficulty", str, description="Filter by difficulty."),
    OpenApiParameter("status", str, description="Filter by status."),
    OpenApiParameter("search", str, description="Search by title or description."),
    OpenApiParameter("ordering", str, description="Ordering field."),
]


class RoboticsProjectViewSet(viewsets.ModelViewSet):
    queryset = RoboticsProject.objects.all()
    filterset_fields = ["difficulty", "status"]
    search_fields = ["title", "description", "components"]
    ordering_fields = ["created_at", "title", "difficulty", "views"]
    ordering = ["-created_at"]
    http_method_names = ["get", "post", "patch", "delete", "head", "options"]

    def get_permissions(self):
        if self.action in ("create", "update", "partial_update", "destroy"):
            self.permission_classes = [IsAdmin | IsManager]
        else:
            self.permission_classes = [IsAdmin | IsManager | IsTechnician | IsSales]
        return super().get_permissions()

    def get_serializer_class(self):
        if self.action in ("create", "update", "partial_update"):
            return RoboticsProjectWriteSerializer
        return RoboticsProjectSerializer

    @extend_schema(
        tags=["robotics"],
        summary="List robotics projects",
        parameters=ROBOTICS_FILTER_PARAMETERS,
        responses={200: RoboticsProjectSerializer(many=True)},
    )
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)

    @extend_schema(
        tags=["robotics"],
        summary="Create a robotics project",
        request=RoboticsProjectWriteSerializer,
        responses={201: RoboticsProjectSerializer},
    )
    def create(self, request, *args, **kwargs):
        return super().create(request, *args, **kwargs)

    @extend_schema(
        tags=["robotics"],
        summary="Update a robotics project",
        request=RoboticsProjectWriteSerializer,
        responses={200: RoboticsProjectSerializer},
    )
    def partial_update(self, request, *args, **kwargs):
        return super().partial_update(request, *args, **kwargs)
