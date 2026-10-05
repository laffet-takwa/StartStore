"""Staff order routes (``/api/admin/orders/``)."""

from __future__ import annotations

from rest_framework.routers import DefaultRouter

from orders.admin_api import AdminOrderViewSet

router = DefaultRouter()
router.register("orders", AdminOrderViewSet, basename="admin-order")

urlpatterns = router.urls