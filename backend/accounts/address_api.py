"""Saved shipping address endpoints (``/api/addresses/``)."""

from __future__ import annotations

from django.db.models import Q
from django_filters import rest_framework as filters
from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import OpenApiExample, OpenApiParameter, extend_schema, extend_schema_view
from rest_framework import mixins, status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from accounts.models import Address
from accounts.serializers import AddressSerializer
from accounts.services import AddressService
from common.permissions import IsCustomer

#: Router lookups are untyped by default; tell the schema generator the pk is a UUID.
ADDRESS_ID_PARAM = OpenApiParameter(
    "id", OpenApiTypes.UUID, OpenApiParameter.PATH, required=True, description="Address id."
)


class AddressFilterSet(filters.FilterSet):
    is_default = filters.BooleanFilter()
    city = filters.CharFilter(field_name="city", lookup_expr="iexact")

    class Meta:
        model = Address
        fields = ["is_default", "city"]


@extend_schema_view(
    retrieve=extend_schema(parameters=[ADDRESS_ID_PARAM], responses={200: AddressSerializer}),
    partial_update=extend_schema(parameters=[ADDRESS_ID_PARAM]),
    destroy=extend_schema(parameters=[ADDRESS_ID_PARAM], responses={204: None}),
    set_default=extend_schema(parameters=[ADDRESS_ID_PARAM], responses={200: AddressSerializer}),
)
class AddressViewSet(
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    mixins.CreateModelMixin,
    mixins.UpdateModelMixin,
    mixins.DestroyModelMixin,
    viewsets.GenericViewSet,
):
    """The authenticated profile's address book.

    ``get_queryset`` is scoped to the owner, so another profile's address id
    resolves to 404 rather than 403.
    """

    serializer_class = AddressSerializer
    permission_classes = [IsAuthenticated, IsCustomer]
    queryset = Address.objects.all()
    filterset_class = AddressFilterSet
    search_fields = ("address_line", "city", "postal_code")
    http_method_names = ["get", "post", "patch", "delete", "head", "options"]
    lookup_value_regex = "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}"

    def get_queryset(self):
        if getattr(self, "swagger_fake_view", False):
            # Schema generation probes with an anonymous request; the scoping
            # filter below would blow up on the placeholder user.
            return self.queryset.none()
        return (
            Address.objects.filter(user=self.request.user)
            .select_related("user")
            .order_by("-is_default", "-created_at")
        )

    @extend_schema(
        tags=["addresses"],
        summary="List my addresses",
        description=(
            "Default address first. Filter with `?is_default=true` for just that one, "
            "or `?search=` across address line, city and postal code."
        ),
        responses={200: AddressSerializer(many=True)},
    )
    def list(self, request, *args, **kwargs) -> Response:
        return super().list(request, *args, **kwargs)

    @extend_schema(
        tags=["addresses"],
        summary="Save an address",
        description="The first address saved always becomes the default.",
        request=AddressSerializer,
        responses={201: AddressSerializer},
        examples=[
            OpenApiExample(
                "Home",
                value={
                    "full_name": "Ada Lovelace",
                    "phone": "+15551234567",
                    "address_line": "1 Analytical Engine Way",
                    "city": "London",
                    "postal_code": "EC1A 1BB",
                    "country": "GB",
                    "is_default": True,
                },
            )
        ],
    )
    def create(self, request, *args, **kwargs) -> Response:
        return super().create(request, *args, **kwargs)

    @extend_schema(
        tags=["addresses"],
        summary="Update an address",
        request=AddressSerializer,
        responses={200: AddressSerializer},
    )
    def partial_update(self, request, *args, **kwargs) -> Response:
        return super().partial_update(request, *args, **kwargs)

    @extend_schema(
        tags=["addresses"],
        summary="Make an address the default",
        request=None,
        responses={200: AddressSerializer},
    )
    @action(detail=True, methods=["post"], url_path="set-default")
    def set_default(self, request, pk=None) -> Response:
        address = self.get_object()
        AddressService.set_default(address)
        return Response(self.get_serializer(self.get_queryset().get(pk=address.pk)).data)

    @extend_schema(
        tags=["addresses"],
        summary="Delete an address",
        request=None,
        responses={204: None},
    )
    def destroy(self, request, *args, **kwargs) -> Response:
        address = self.get_object()
        address.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
