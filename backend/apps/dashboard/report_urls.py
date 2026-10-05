"""
URLs for reports app.
"""
from django.urls import path
from .views import ReportsViewSet

urlpatterns = [
    path('sales/', ReportsViewSet.as_view({'get': 'sales'}), name='report-sales'),
    path('repairs/', ReportsViewSet.as_view({'get': 'repairs'}), name='report-repairs'),
    path('inventory/', ReportsViewSet.as_view({'get': 'inventory'}), name='report-inventory'),
    path('customers/', ReportsViewSet.as_view({'get': 'customers'}), name='report-customers'),
]