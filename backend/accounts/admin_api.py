"""Staff-only profile management endpoints (``/api/admin/users/``).

``role`` is the only lever here: the schema has no ``is_active`` column, so an
account is deactivated in Supabase Auth rather than in ``public.profiles``.
"""

from __future__ import annotations

from django.db.models import Count, Q
from django_filters import rest_framework as filters
from drf_spectacular.utils import extend_schema
from rest_framework import mixins, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from accounts.constants import UserRole
from accounts.models import Profile
from accounts.serializers import AdminProfileSerializer
from common.exceptions import BusinessRuleError
from common.permissions import IsAdmin


class AdminProfileFilterSet(filters.FilterSet):
    role = filters.ChoiceFilter(choices=UserRole.choices)
    search = filters.CharFilter(method="filter_search")
    joined_after = filters.DateTimeFilter(field_name="created_at", lookup_expr="gte")
    joined_before = filters.DateTimeFilter(field_name="created_at", lookup_expr="lt")

    class Meta:
        model = Profile
        fields = ["role"]

    def filter_search(self, queryset, name, value):
        return queryset.filter(
            Q(email__icontains=value)
            | Q(full_name__icontains=value)
            | Q(phone__icontains=value)
        )


class AdminProfileViewSet(
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    mixins.UpdateModelMixin,
    viewsets.GenericViewSet,
):
    """The customer directory, with role assignment."""

    serializer_class = AdminProfileSerializer
    permission_classes = [IsAdmin]
    filterset_class = AdminProfileFilterSet
    search_fields = ("email", "full_name")
    ordering_fields = ("created_at", "full_name", "email", "role")
    ordering = ("-created_at",)

    def get_queryset(self):
        return Profile.objects.annotate(
            order_count=Count("orders"),
            address_count=Count("addresses"),
        ).order_by("-created_at")

    @extend_schema(
        tags=["admin"],
        summary="List profiles",
        responses={200: AdminProfileSerializer(many=True)},
    )
    def list(self, request, *args, **kwargs) -> Response:
        return super().list(request, *args, **kwargs)

    @extend_schema(
        tags=["admin"],
        summary="Update a profile",
        description="Staff may correct `full_name`, `phone`, `avatar_url` and `role`.",
        request=AdminProfileSerializer,
        responses={200: AdminProfileSerializer},
    )
    def partial_update(self, request, *args, **kwargs) -> Response:
        return super().partial_update(request, *args, **kwargs)

    @extend_schema(
        tags=["admin"],
        summary="Promote or demote a profile",
        description="Shorthand for setting `role`. An admin cannot demote themselves.",
        request=None,
        responses={200: AdminProfileSerializer},
    )
    @action(detail=True, methods=["post"], url_path="role")
    def set_role(self, request, role=None, *args, **kwargs) -> Response:
        profile = self.get_object()
        target = request.data.get("role")
        if target not in dict(UserRole.choices):
            raise BusinessRuleError(
                "Unknown role.", code="invalid_role"
            )
        if profile.pk == request.user.pk and target != UserRole.ADMIN:
            raise BusinessRuleError(
                "You cannot remove your own admin role.", code="self_demotion_forbidden"
            )
        profile.role = target
        profile.save(update_fields=["role", "updated_at"])
        return Response(self.get_serializer(profile).data)