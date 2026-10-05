"""Address URL configuration (``/api/addresses/``)."""

from __future__ import annotations

from rest_framework.routers import DefaultRouter

from accounts.address_api import AddressViewSet

router = DefaultRouter()
router.register("", AddressViewSet, basename="address")

urlpatterns = router.urls