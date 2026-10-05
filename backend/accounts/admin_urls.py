"""Staff profile management routes (``/api/admin/users/``)."""

from __future__ import annotations

from rest_framework.routers import DefaultRouter

from accounts.admin_api import AdminProfileViewSet

router = DefaultRouter()
router.register("users", AdminProfileViewSet, basename="admin-user")

urlpatterns = router.urls