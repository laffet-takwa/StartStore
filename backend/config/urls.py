"""Root URL configuration for the StartStore API.

There is deliberately no ``admin/`` route: Supabase Auth owns credentials, so
Django has no way to authenticate an administrator into a session-based admin.
Staff operations live under ``/api/admin/`` and roles are assigned with
``python manage.py set_role``.
"""

from django.conf import settings
from django.conf.urls.static import static
from django.urls import include, path
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularRedocView,
    SpectacularSwaggerView,
)

#: Staff endpoints, all mounted under ``/api/admin/``.
admin_api_urls = [
    path("", include("common.urls")),
    path("", include("accounts.admin_urls")),
    path("", include("products.admin_urls")),
    path("", include("orders.admin_urls")),
]

urlpatterns = [
    # --- API -------------------------------------------------------------- #
    path("api/auth/", include("accounts.urls")),
    path("api/addresses/", include("accounts.address_urls")),
    path("api/categories/", include("categories.urls")),
    path("api/products/", include("products.urls")),
    path("api/cart/", include("cart.urls")),
    path("api/wishlist/", include("wishlist.urls")),
    path("api/orders/", include("orders.urls")),
    # Staff-only capture. `payments` owns no tables, so this lives in the
    # payments namespace but is guarded by IsAdmin.
    path("api/payments/", include("payments.urls")),
    path("api/admin/", include(admin_api_urls)),
    # --- Documentation ------------------------------------------------------ #
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path("api/docs/", SpectacularSwaggerView.as_view(url_name="schema"), name="swagger-ui"),
    path("api/redoc/", SpectacularRedocView.as_view(url_name="schema"), name="redoc"),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
