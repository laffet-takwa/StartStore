from django.urls import include, path
from rest_framework.routers import DefaultRouter

from repairs.views import RepairViewSet

router = DefaultRouter()
router.register(r"", RepairViewSet, basename="repair")

urlpatterns = [
    path("", include(router.urls)),
]
