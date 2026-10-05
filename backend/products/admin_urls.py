"""Staff product routes (``/api/admin/products/``)."""

from __future__ import annotations

from rest_framework.routers import DefaultRouter

from products.admin_api import AdminProductViewSet

router = DefaultRouter()
router.register("products", AdminProductViewSet, basename="admin-product")

urlpatterns = router.urls