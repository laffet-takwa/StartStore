from django.urls import include, path
from rest_framework.routers import DefaultRouter

from reports.views import DashboardView, SalesReportView, RepairsReportView

router = DefaultRouter()

urlpatterns = [
    path("dashboard/", DashboardView.as_view(), name="dashboard"),
    path("sales/", SalesReportView.as_view(), name="sales-report"),
    path("repairs/", RepairsReportView.as_view(), name="repairs-report"),
]
