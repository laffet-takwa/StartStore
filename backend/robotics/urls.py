from django.urls import include, path
from rest_framework.routers import DefaultRouter

from robotics.views import RoboticsProjectViewSet

router = DefaultRouter()
router.register(r"", RoboticsProjectViewSet, basename="robotics")

urlpatterns = [
    path("", include(router.urls)),
]
