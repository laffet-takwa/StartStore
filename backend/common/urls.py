"""URLs for the cross-app admin endpoints."""

from django.urls import path

from common.views import AdminDashboardView

urlpatterns = [
    path("dashboard/", AdminDashboardView.as_view(), name="admin-dashboard"),
]