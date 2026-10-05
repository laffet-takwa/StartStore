"""Product URL configuration (``/api/products/``)."""

from __future__ import annotations

from django.urls import include, path
from rest_framework.routers import DefaultRouter

from products.views import ProductImageViewSet, ProductViewSet

router = DefaultRouter()
router.register("", ProductViewSet, basename="product")

# Gallery endpoints are mounted by hand so the parent product id lives in the
# path (`/api/products/{product_id}/images/`) instead of the request body.
image_collection = ProductImageViewSet.as_view({"get": "list", "post": "create"})
image_detail = ProductImageViewSet.as_view(
    {"get": "retrieve", "patch": "partial_update", "delete": "destroy"}
)

urlpatterns = [
    path("<uuid:product_id>/images/", image_collection, name="product-image-list"),
    path("<uuid:product_id>/images/<uuid:pk>/", image_detail, name="product-image-detail"),
    path("", include(router.urls)),
]