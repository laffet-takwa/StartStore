"""Cart endpoints."""

from __future__ import annotations

from drf_spectacular.utils import OpenApiExample, extend_schema
from rest_framework import mixins, status, viewsets
from rest_framework.generics import GenericAPIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from cart.exceptions import CartItemUnavailableError
from cart.models import CartItem
from cart.serializers import CartItemSerializer, CartItemUpdateSerializer, CartSerializer
from cart.services import CartService
from common.permissions import IsOwner
from products.models import Product


class CartView(GenericAPIView):
    """Read or clear the authenticated customer's cart.

    ``GET /api/cart/`` returns the cart, creating an empty one on first call.
    """

    permission_classes = [IsAuthenticated]
    serializer_class = CartSerializer

    @extend_schema(
        tags=["cart"],
        summary="Get my cart",
        description="Returns the cart with its lines and the server-computed subtotal.",
        responses={200: CartSerializer},
    )
    def get(self, request, *args, **kwargs) -> Response:
        cart = CartService.get_or_create(request.user)
        return Response(self.get_serializer(cart).data)

    @extend_schema(
        tags=["cart"],
        summary="Empty my cart",
        request=None,
        responses={200: CartSerializer},
    )
    def delete(self, request, *args, **kwargs) -> Response:
        cart = CartService.get_or_create(request.user)
        CartService.clear(cart)
        cart.refresh_from_db()
        return Response(self.get_serializer(cart).data)


class CartItemViewSet(
    mixins.CreateModelMixin,
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    mixins.UpdateModelMixin,
    mixins.DestroyModelMixin,
    viewsets.GenericViewSet,
):
    """Lines inside the authenticated customer's cart.

    ``get_queryset`` is scoped to the requester's own cart, which is both the
    ownership check and the reason another cart's ids resolve to 404.
    ``IsOwner`` is layered on top as an explicit second check.
    """

    serializer_class = CartItemSerializer
    permission_classes = [IsAuthenticated, IsOwner]
    queryset = CartItem.objects.all()
    # A cart item is owned through its cart, not directly.
    owner_field = "cart.user"
    http_method_names = ["get", "post", "patch", "delete", "head", "options"]

    def get_queryset(self):
        cart = CartService.get_or_create(self.request.user)
        return (
            CartItem.objects.filter(cart=cart)
            .select_related("product", "product__category")
            .order_by("created_at", "id")
        )

    def _cart(self):
        return CartService.get_or_create(self.request.user)

    @extend_schema(
        tags=["cart"],
        summary="List cart items",
        responses={200: CartItemSerializer(many=True)},
    )
    def list(self, request, *args, **kwargs) -> Response:
        return super().list(request, *args, **kwargs)

    @extend_schema(
        tags=["cart"],
        summary="Add a product to the cart",
        description=(
            "Creates the line, or increases the quantity when the product is already "
            "in the cart. Rejects inactive products and quantities above stock."
        ),
        request=CartItemSerializer,
        responses={201: CartItemSerializer},
        examples=[
            OpenApiExample("Add one unit", value={"product_id": 1, "quantity": 1}),
            OpenApiExample("Add several units", value={"product_id": 3, "quantity": 4}),
        ],
    )
    def create(self, request, *args, **kwargs) -> Response:
        serializer = CartItemSerializer(data=request.data, context=self.get_serializer_context())
        serializer.is_valid(raise_exception=True)

        product: Product = serializer.validated_data["product"]
        item = CartService.add_item(self._cart(), product, serializer.validated_data["quantity"])
        output = CartItemSerializer(item, context=self.get_serializer_context())
        return Response(output.data, status=status.HTTP_201_CREATED)

    @extend_schema(
        tags=["cart"],
        summary="Change a cart line quantity",
        request=CartItemUpdateSerializer,
        responses={200: CartItemSerializer},
    )
    def partial_update(self, request, *args, **kwargs) -> Response:
        payload = CartItemUpdateSerializer(data=request.data)
        payload.is_valid(raise_exception=True)

        item = self.get_object()
        updated = CartService.set_quantity(self._cart(), item, payload.validated_data["quantity"])
        return Response(CartItemSerializer(updated, context=self.get_serializer_context()).data)

    @extend_schema(
        tags=["cart"],
        summary="Remove a cart line",
        request=None,
        responses={204: None},
    )
    def destroy(self, request, *args, **kwargs) -> Response:
        item = self.get_object()
        CartService.remove_item(self._cart(), item)
        return Response(status=status.HTTP_204_NO_CONTENT)