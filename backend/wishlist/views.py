"""Wishlist endpoints.

The lookup field is the product id, so a wishlist is addressed by *what* is
saved rather than by an opaque row id::

    GET    /api/wishlist/                 list my saved products
    POST   /api/wishlist/toggle/          add or remove a product
    DELETE /api/wishlist/{product_id}/    remove a saved product
"""

from __future__ import annotations

from django.shortcuts import get_object_or_404
from drf_spectacular.utils import OpenApiExample, extend_schema
from rest_framework import mixins, status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from products.models import Product
from wishlist.models import Wishlist
from wishlist.serializers import (
    WishlistSerializer,
    WishlistToggleResultSerializer,
    WishlistToggleSerializer,
)


class WishlistViewSet(
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    mixins.DestroyModelMixin,
    viewsets.GenericViewSet,
):
    """The authenticated customer's wishlist."""

    serializer_class = WishlistSerializer
    permission_classes = [IsAuthenticated]
    queryset = Wishlist.objects.all()
    http_method_names = ["get", "post", "delete", "head", "options"]
    lookup_field = "product_id"
    lookup_url_kwarg = "product_id"

    def get_queryset(self):
        # Ownership is enforced by scoping the queryset to request.user.
        return Wishlist.objects.filter(user=self.request.user).select_related(
            "product", "product__category"
        )

    @extend_schema(
        tags=["wishlist"],
        summary="List my wishlist",
        responses={200: WishlistSerializer(many=True)},
    )
    def list(self, request, *args, **kwargs) -> Response:
        return super().list(request, *args, **kwargs)

    @extend_schema(
        tags=["wishlist"],
        summary="Add or remove a product",
        description=(
            "Idempotent toggle. Returns the resulting membership state and the new "
            "wishlist size so the client can update its badge without refetching."
        ),
        request=WishlistToggleSerializer,
        responses={200: WishlistToggleResultSerializer},
        examples=[OpenApiExample("Toggle", value={"product_id": 1})],
    )
    @action(detail=False, methods=["post"], url_path="toggle")
    def toggle(self, request, *args, **kwargs) -> Response:
        payload = WishlistToggleSerializer(data=request.data)
        payload.is_valid(raise_exception=True)

        product = get_object_or_404(
            Product.objects.filter(is_active=True),
            pk=payload.validated_data["product_id"],
        )

        entry, created = Wishlist.objects.get_or_create(user=request.user, product=product)
        if not created:
            entry.delete()

        return Response(
            {
                "in_wishlist": created,
                "product_id": product.id,
                "count": Wishlist.objects.filter(user=request.user).count(),
            }
        )

    @extend_schema(
        tags=["wishlist"],
        summary="Remove a saved product",
        request=None,
        responses={204: None},
    )
    def destroy(self, request, *args, **kwargs) -> Response:
        entry = self.get_object()
        entry.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)