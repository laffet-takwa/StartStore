"""Payment URL configuration (``/api/payments/``)."""

from __future__ import annotations

from django.urls import path

from payments.views import OrderPaymentCaptureView

urlpatterns = [
    path(
        "<uuid:order_id>/capture/",
        OrderPaymentCaptureView.as_view(),
        name="payment-capture",
    ),
]