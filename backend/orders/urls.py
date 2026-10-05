"""Order URL configuration (``/api/orders/``)."""

from __future__ import annotations

from rest_framework.routers import DefaultRouter

from orders.views import OrderViewSet

router = DefaultRouter()
router.register("", OrderViewSet, basename="order")

urlpatterns = router.urls