"""
URLs for sales app.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import SaleViewSet, PaymentViewSet, SaleItemViewSet

router = DefaultRouter()
router.register(r'', SaleViewSet, basename='sale')
router.register(r'payments', PaymentViewSet, basename='payment')
router.register(r'items', SaleItemViewSet, basename='sale-item')

urlpatterns = [
    path('', include(router.urls)),
]