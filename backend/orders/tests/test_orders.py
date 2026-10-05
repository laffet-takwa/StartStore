"""Order history, ownership and customer-initiated cancellation."""

from __future__ import annotations

from decimal import Decimal

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
from payments.services import PaymentService


class OrderTestCase(TestCase):
    def setUp(self) -> None:
        install_fake_supabase()
        self.category = create_category("Electronics")
        self.product = create_product(
            category=self.category, name="Keyboard", sku="KB-1", price="120.00", stock=20
        )
        self.user = create_profile(email="shopper@example.com")
        self.client = auth_client(self.user)

    def place_order(self, quantity=2, client=None):
        client = client or self.client
        client.post(
            "/api/cart/items/",
            {"product_id": str(self.product.pk), "quantity": quantity},
            format="json",
        )
        response = client.post("/api/orders/", checkout_payload(), format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED, msg=response.data)
        return Order.objects.get(pk=response.data["id"])


class OrderListTests(OrderTestCase):
    def test_orders_require_authentication(self):
        response = APIClient().get("/api/orders/")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_list_returns_only_my_orders(self):
        self.place_order()
        other = create_profile(email="other@example.com")
        self.place_order(quantity=1, client=auth_client(other))

        response = self.client.get("/api/orders/")
        self.assertEqual(response.status_code, status.HTTP_200_OK, msg=response.data)
        self.assertEqual(response.data["count"], 1)
        self.assertEqual(response.data["results"][0]["user_email"], "shopper@example.com")

    def test_list_payload_omits_heavy_nested_collections(self):
        self.place_order()
        row = self.client.get("/api/orders/").data["results"][0]
        self.assertNotIn("items", row)
        self.assertNotIn("shipping_address", row)
        self.assertIn("order_number", row)
        self.assertIn("item_count", row)

    def test_filter_by_status(self):
        self.place_order()
        response = self.client.get(f"/api/orders/?status={OrderStatus.PENDING}")
        self.assertEqual(response.data["count"], 1)

        response = self.client.get(f"/api/orders/?status={OrderStatus.DELIVERED}")
        self.assertEqual(response.data["count"], 0)

    def test_retrieve_my_order_includes_items_and_address(self):
        order = self.place_order()
        response = self.client.get(f"/api/orders/{order.pk}/")
        self.assertEqual(response.status_code, status.HTTP_200_OK, msg=response.data)
        self.assertEqual(len(response.data["items"]), 1)
        self.assertEqual(response.data["items"][0]["product_name"], "Keyboard")
        self.assertEqual(response.data["shipping_address"]["city"], "London")
        self.assertTrue(response.data["can_cancel"])

    def test_cannot_read_another_customers_order(self):
        order = self.place_order()
        intruder = create_profile(email="intruder@example.com")
        response = auth_client(intruder).get(f"/api/orders/{order.pk}/")
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_order_numbers_cannot_be_guessed_into(self):
        order = self.place_order()
        other = create_profile(email="intruder@example.com")
        response = auth_client(other).get(f"/api/orders/{order.order_number}/")
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)


class OrderAccessRoleTests(OrderTestCase):
    def test_staff_cannot_check_out_through_the_storefront(self):

        admin_client = auth_client(create_admin(email="boss@example.com"))
        admin_client.post(
            "/api/cart/items/",
            {"product_id": str(self.product.pk), "quantity": 1},
            format="json",
        )
        response = admin_client.post("/api/orders/", checkout_payload(), format="json")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(Order.objects.count(), 0)

    def test_staff_cannot_browse_customer_orders(self):

        self.place_order()
        response = auth_client(create_admin(email="boss@example.com")).get("/api/orders/")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


class OrderCancellationTests(OrderTestCase):
    def test_cancel_pending_order_restores_stock(self):
        order = self.place_order(quantity=3)
        self.product.refresh_from_db()
        self.assertEqual(self.product.stock, 17)

        response = self.client.post(f"/api/orders/{order.pk}/cancel/")
        self.assertEqual(response.status_code, status.HTTP_200_OK, msg=response.data)
        self.assertEqual(response.data["status"], OrderStatus.CANCELLED)

        order.refresh_from_db()
        self.assertEqual(order.status, OrderStatus.CANCELLED)
        self.product.refresh_from_db()
        self.assertEqual(self.product.stock, 20, "reserved stock must be returned")

    def test_cancel_a_paid_order_marks_it_refunded(self):
        order = self.place_order()
        PaymentService.mark_paid(order)

        response = self.client.post(f"/api/orders/{order.pk}/cancel/")
        self.assertEqual(response.status_code, status.HTTP_200_OK, msg=response.data)
        self.assertEqual(response.data["payment_status"], PaymentStatus.REFUNDED)
        order.refresh_from_db()
        self.assertEqual(order.payment_status, PaymentStatus.REFUNDED)

    def test_cannot_cancel_a_shipped_order(self):
        order = self.place_order()
        OrderService.transition(
            order, OrderStatus.CONFIRMED
        )
        OrderService.transition(Order.objects.get(pk=order.pk), OrderStatus.PROCESSING)
        OrderService.transition(Order.objects.get(pk=order.pk), OrderStatus.SHIPPED)

        response = self.client.post(f"/api/orders/{order.pk}/cancel/")
        self.assertEqual(response.status_code, status.HTTP_409_CONFLICT)
        self.assertEqual(response.data["error"]["code"], "order_not_cancellable")
        self.assertEqual(Order.objects.get(pk=order.pk).status, OrderStatus.SHIPPED)

    def test_cannot_cancel_a_cancelled_order(self):
        order = self.place_order()
        self.client.post(f"/api/orders/{order.pk}/cancel/")
        response = self.client.post(f"/api/orders/{order.pk}/cancel/")
        self.assertEqual(response.status_code, status.HTTP_409_CONFLICT)

    def test_cannot_cancel_another_customers_order(self):
        order = self.place_order()
        intruder = create_profile(email="intruder@example.com")
        response = auth_client(intruder).post(f"/api/orders/{order.pk}/cancel/")
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(Order.objects.get(pk=order.pk).status, OrderStatus.PENDING)

    def test_cancel_requires_authentication(self):
        order = self.place_order()
        response = APIClient().post(f"/api/orders/{order.pk}/cancel/")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_a_customer_cannot_set_the_status_directly(self):
        order = self.place_order()
        response = self.client.patch(
            f"/api/orders/{order.pk}/", {"status": OrderStatus.DELIVERED}, format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)
        self.assertEqual(Order.objects.get(pk=order.pk).status, OrderStatus.PENDING)

    def test_cancelled_order_items_keep_their_snapshot(self):
        order = self.place_order(quantity=2)
        item_pk = order.items.first().pk
        self.client.post(f"/api/orders/{order.pk}/cancel/")

        from orders.models import OrderItem

        item = OrderItem.objects.get(pk=item_pk)
        self.assertEqual(item.unit_price, Decimal("120.00"))
        self.assertEqual(item.quantity, 2)