"""
URLs for repairs app.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import RepairViewSet, RepairImageViewSet, RepairPartViewSet

router = DefaultRouter()
router.register(r'', RepairViewSet, basename='repair')
router.register(r'images', RepairImageViewSet, basename='repair-image')
router.register(r'parts', RepairPartViewSet, basename='repair-part')

urlpatterns = [
    path('', include(router.urls)),
]