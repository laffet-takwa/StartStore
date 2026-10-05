"""Category URL configuration (``/api/categories/``)."""

from __future__ import annotations

from rest_framework.routers import DefaultRouter

from categories.views import CategoryViewSet

router = DefaultRouter()
router.register("", CategoryViewSet, basename="category")

urlpatterns = router.urls