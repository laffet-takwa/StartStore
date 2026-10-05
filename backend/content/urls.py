from django.urls import include, path
from rest_framework.routers import DefaultRouter

from content.views import EducationalContentViewSet

router = DefaultRouter()
router.register(r"", EducationalContentViewSet, basename="content")

urlpatterns = [
    path("", include(router.urls)),
]
