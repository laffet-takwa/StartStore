"""Cart URL configuration (``/api/cart/``)."""

from __future__ import annotations

from django.urls import include, path
from rest_framework.routers import DefaultRouter

from cart.views import CartItemViewSet, CartView

router = DefaultRouter()
router.register("items", CartItemViewSet, basename="cart-item")

urlpatterns = [
    path("", CartView.as_view(), name="cart-detail"),
    path("", include(router.urls)),
]