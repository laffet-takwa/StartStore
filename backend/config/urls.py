"""
URL configuration for STAR STORE MANAGER project.
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView, SpectacularRedocView

urlpatterns = [
    # Admin
    path('admin/', admin.site.urls),

    # API Schema & Documentation
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('api/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),

    # Authentication
    path('api/auth/', include('apps.accounts.urls')),

    # API Endpoints
    path('api/employees/', include('apps.accounts.employee_urls')),
    path('api/customers/', include('apps.customers.urls')),
    path('api/devices/', include('apps.customers.device_urls')),
    path('api/repairs/', include('apps.repairs.urls')),
    path('api/public/repairs/', include('apps.repairs.public_urls')),
    path('api/products/', include('apps.inventory.product_urls')),
    path('api/categories/', include('apps.inventory.category_urls')),
    path('api/suppliers/', include('apps.inventory.supplier_urls')),
    path('api/inventory/', include('apps.inventory.urls')),
    path('api/sales/', include('apps.sales.urls')),
    path('api/payments/', include('apps.sales.payment_urls')),
    path('api/invoices/', include('apps.invoices.urls')),
    path('api/dashboard/', include('apps.dashboard.urls')),
    path('api/reports/', include('apps.dashboard.report_urls')),
    path('api/notifications/', include('apps.notifications.urls')),
    path('api/audit/', include('apps.audit.urls')),
]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)