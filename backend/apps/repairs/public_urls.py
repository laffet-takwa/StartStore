"""
Public URLs for repair tracking.
"""
from django.urls import path
from .views import PublicRepairTrackingViewSet

urlpatterns = [
    path('status/', PublicRepairTrackingViewSet.as_view({'get': 'track'}), name='public-repair-track'),
    path('history/<str:matricule>/', PublicRepairTrackingViewSet.as_view({'get': 'history'}), name='public-repair-history'),
]