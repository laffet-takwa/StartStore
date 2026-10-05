"""Content endpoints."""

from __future__ import annotations

from drf_spectacular.utils import OpenApiParameter, extend_schema
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from common.permissions import IsAdmin, IsManager, IsTechnician, IsSales
from content.models import EducationalContent
from content.serializers import EducationalContentSerializer, EducationalContentWriteSerializer


CONTENT_FILTER_PARAMETERS = [
    OpenApiParameter("content_type", str, description="Filter by content type."),
    OpenApiParameter("status", str, description="Filter by status."),
    OpenApiParameter("search", str, description="Search by title or description."),
    OpenApiParameter("ordering", str, description="Ordering field."),
]


class EducationalContentViewSet(viewsets.ModelViewSet):
    queryset = EducationalContent.objects.all()
    filterset_fields = ["content_type", "status"]
    search_fields = ["title", "description", "category"]
    ordering_fields = ["created_at", "title", "views"]
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
            return EducationalContentWriteSerializer
        return EducationalContentSerializer

    @extend_schema(
        tags=["content"],
        summary="List content",
        parameters=CONTENT_FILTER_PARAMETERS,
        responses={200: EducationalContentSerializer(many=True)},
    )
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)

    @extend_schema(
        tags=["content"],
        summary="Create content",
        request=EducationalContentWriteSerializer,
        responses={201: EducationalContentSerializer},
    )
    def create(self, request, *args, **kwargs):
        return super().create(request, *args, **kwargs)

    @extend_schema(
        tags=["content"],
        summary="Update content",
        request=EducationalContentWriteSerializer,
        responses={200: EducationalContentSerializer},
    )
    def partial_update(self, request, *args, **kwargs):
        return super().partial_update(request, *args, **kwargs)

    @extend_schema(
        tags=["content"],
        summary="Publish content",
        request=None,
        responses={200: EducationalContentSerializer},
    )
    @action(detail=True, methods=["post"])
    def publish(self, request, pk=None):
        content = self.get_object()
        content.status = "published"
        from django.utils import timezone
        content.published_at = timezone.now()
        content.save(update_fields=["status", "published_at", "updated_at"])
        return Response(EducationalContentSerializer(content).data)

    @extend_schema(
        tags=["content"],
        summary="Unpublish content",
        request=None,
        responses={200: EducationalContentSerializer},
    )
    @action(detail=True, methods=["post"])
    def unpublish(self, request, pk=None):
        content = self.get_object()
        content.status = "draft"
        content.save(update_fields=["status", "updated_at"])
        return Response(EducationalContentSerializer(content).data)
