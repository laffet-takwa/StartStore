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
    path("", include("employees.urls")),
    path("", include("customers.urls")),
    path("", include("devices.urls")),
    path("", include("repairs.urls")),
    path("", include("suppliers.urls")),
    path("", include("inventory.urls")),
    path("", include("sales.urls")),
    path("", include("payments.urls")),
    path("", include("invoices.urls")),
    path("", include("content.urls")),
    path("", include("robotics.urls")),
    path("", include("notifications.urls")),
    path("", include("reports.urls")),
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
    path("api/customers/", include("customers.urls")),
    path("api/devices/", include("devices.urls")),
    path("api/repairs/", include("repairs.urls")),
    path("api/suppliers/", include("suppliers.urls")),
    path("api/inventory/", include("inventory.urls")),
    path("api/sales/", include("sales.urls")),
    path("api/invoices/", include("invoices.urls")),
    path("api/employees/", include("employees.urls")),
    path("api/content/", include("content.urls")),
    path("api/robotics/", include("robotics.urls")),
    path("api/notifications/", include("notifications.urls")),
    path("api/reports/", include("reports.urls")),
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
