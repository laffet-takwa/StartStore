"""Wishlist URL configuration (``/api/wishlist/``)."""

from __future__ import annotations

from rest_framework.routers import DefaultRouter

from wishlist.views import WishlistViewSet

router = DefaultRouter()
router.register("", WishlistViewSet, basename="wishlist")

urlpatterns = router.urls