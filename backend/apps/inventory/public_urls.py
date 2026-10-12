"""
Public (unauthenticated) URLs for the storefront catalog.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PublicProductViewSet, PublicCategoryViewSet

router = DefaultRouter()
router.register(r'products', PublicProductViewSet, basename='public-product')
router.register(r'categories', PublicCategoryViewSet, basename='public-category')

urlpatterns = [
    path('', include(router.urls)),
]
