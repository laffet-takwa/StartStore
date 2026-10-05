"""
URLs for dashboard app.
"""
from django.urls import path
from .views import DashboardViewSet

urlpatterns = [
    path('', DashboardViewSet.as_view({'get': 'overview'}), name='dashboard'),
]