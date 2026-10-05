"""Payment outcomes applied to ``orders.payment_status``.

There is no ``payments`` table in the schema, so these tests assert the
service's state machine against the order row itself.
"""

from __future__ import annotations

from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient

from common.constants import OrderStatus, PaymentStatus
from common.testing import (
    auth_client,
    checkout_payload,
    create_admin,
    create_category,
    create_product,
    create_profile,
    install_fake_supabase,
)
from orders.models import Order
from orders.services import OrderService
from payments.services import PaymentError, PaymentService


class PaymentTestCase(TestCase):
    def setUp(self) -> None:
        install_fake_supabase()
        self.category = create_category("Electronics")
        self.product = create_product(
            category=self.category, name="Keyboard", sku="KB-1", price="120.00", stock=20
        )
        self.profile = create_profile(email="shopper@example.com")
        self.client = auth_client(self.profile)
        self.admin = create_admin(email="boss@example.com")
        self.admin_client = auth_client(self.admin)

        self.client.post(
            "/api/cart/items/",
            {"product_id": str(self.product.pk), "quantity": 2},
            format="json",
        )
        response = self.client.post("/api/orders/", checkout_payload(), format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED, msg=response.data)
        self.order = Order.objects.get(pk=response.data["id"])

    def test_checkout_leaves_payment_pending(self):
        self.assertEqual(self.order.payment_status, PaymentStatus.PENDING)
        self.assertEqual(self.order.total, self.order.subtotal + self.order.shipping_cost)

    def test_there_is_no_payments_table(self):
        """Payment state lives on the order; the app holds no models."""
        from django.apps import apps

        self.assertEqual(
            [m._meta.db_table for m in apps.get_app_config("payments").get_models()],
            [],
        )


class CaptureEndpointTests(PaymentTestCase):
    def test_admin_can_capture_a_payment(self):
        response = self.admin_client.post(f"/api/payments/{self.order.pk}/capture/")
        self.assertEqual(response.status_code, status.HTTP_200_OK, msg=response.data)
        self.assertEqual(response.data["payment_status"], PaymentStatus.PAID)

        self.order.refresh_from_db()
        self.assertEqual(self.order.payment_status, PaymentStatus.PAID)

    def test_customer_cannot_capture_their_own_payment(self):
        """A sandbox capture must not be a self-service action."""
        response = self.client.post(f"/api/payments/{self.order.pk}/capture/")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.order.refresh_from_db()
        self.assertEqual(self.order.payment_status, PaymentStatus.PENDING)

    def test_anonymous_cannot_capture(self):
        response = APIClient().post(f"/api/payments/{self.order.pk}/capture/")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_unknown_order_is_404(self):
        import uuid as uuid_module

        response = self.admin_client.post(f"/api/payments/{uuid_module.uuid4()}/capture/")
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_capturing_twice_is_a_conflict(self):
        self.admin_client.post(f"/api/payments/{self.order.pk}/capture/")
        response = self.admin_client.post(f"/api/payments/{self.order.pk}/capture/")
        self.assertEqual(response.status_code, status.HTTP_409_CONFLICT)
        self.assertEqual(response.data["error"]["code"], "already_paid")

    def test_cancelled_order_cannot_be_captured(self):
        OrderService.cancel(self.order)
        response = self.admin_client.post(f"/api/payments/{self.order.pk}/capture/")
        self.assertEqual(response.status_code, status.HTTP_409_CONFLICT)
        self.assertEqual(response.data["error"]["code"], "order_cancelled")


class PaymentServiceTests(PaymentTestCase):
    def test_mark_paid_is_idempotent(self):
        PaymentService.mark_paid(self.order)
        PaymentService.mark_paid(self.order)
        self.order.refresh_from_db()
        self.assertEqual(self.order.payment_status, PaymentStatus.PAID)

    def test_a_captured_payment_cannot_be_marked_failed(self):
        PaymentService.mark_paid(self.order)
        with self.assertRaises(PaymentError) as ctx:
            PaymentService.mark_failed(self.order, reason="gateway timeout")
        self.assertEqual(ctx.exception.code, "already_paid")

    def test_mark_failed_then_refund_is_rejected(self):
        PaymentService.mark_failed(self.order, reason="card declined")
        self.order.refresh_from_db()
        self.assertEqual(self.order.payment_status, PaymentStatus.FAILED)

        with self.assertRaises(PaymentError) as ctx:
            PaymentService.mark_refunded(self.order)
        self.assertEqual(ctx.exception.code, "not_paid")

    def test_refund_requires_a_capture(self):
        with self.assertRaises(PaymentError):
            PaymentService.mark_refunded(self.order)

    def test_cancelling_a_paid_order_refunds_it(self):
        PaymentService.mark_paid(self.order)
        OrderService.cancel(self.order)

        self.order.refresh_from_db()
        self.assertEqual(self.order.status, OrderStatus.CANCELLED)
        self.assertEqual(self.order.payment_status, PaymentStatus.REFUNDED)

    def test_a_refunded_order_cannot_be_captured_again(self):
        PaymentService.mark_paid(self.order)
        OrderService.cancel(self.order)
        with self.assertRaises(PaymentError) as ctx:
            PaymentService.mark_paid(self.order)
        self.assertEqual(ctx.exception.code, "already_refunded")

    def test_status_change_does_not_fabricate_a_payment(self):
        OrderService.transition(self.order, OrderStatus.CONFIRMED)
        self.order.refresh_from_db()
        self.assertEqual(
            self.order.payment_status,
            PaymentStatus.PENDING,
            "marking an order confirmed is not a payment capture",
        )
