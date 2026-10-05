"""Staff order management: dashboard, order list and status transitions."""

from __future__ import annotations

from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient

from common.constants import OrderStatus, PaymentStatus
from common.testing import auth_client, checkout_payload, create_admin, create_category, create_product, create_profile
from orders.models import Order
from orders.services import OrderService
from payments.services import PaymentService


class AdminOrderTestCase(TestCase):
    def setUp(self) -> None:
        self.category = create_category("Electronics")
        self.product = create_product(
            category=self.category, name="Keyboard", sku="KB-1", price="120.00", stock=50
        )
        self.customer = create_profile(email="shopper@example.com")
        self.customer_client = auth_client(self.customer)
        self.admin = create_admin()
        self.admin_client = auth_client(self.admin)

    def place_order(self, quantity=1, client=None) -> Order:
        client = client or self.customer_client
        client.post(
            "/api/cart/items/",
            {"product_id": self.product.id, "quantity": quantity},
            format="json",
        )
        response = client.post("/api/orders/", checkout_payload(), format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED, msg=response.data)
        return Order.objects.get(pk=response.data["id"])


class DashboardTests(AdminOrderTestCase):
    def test_dashboard_requires_authentication(self):
        self.assertEqual(
            APIClient().get("/api/admin/dashboard/").status_code,
            status.HTTP_401_UNAUTHORIZED,
        )

    def test_customer_cannot_read_the_dashboard(self):
        self.assertEqual(
            self.customer_client.get("/api/admin/dashboard/").status_code,
            status.HTTP_403_FORBIDDEN,
        )

    def test_dashboard_reports_metrics(self):
        order = self.place_order(quantity=2)
        PaymentService.mark_paid(order)

        response = self.admin_client.get("/api/admin/dashboard/")
        self.assertEqual(response.status_code, status.HTTP_200_OK, msg=response.data)

        metrics = response.data["metrics"]
        self.assertEqual(metrics["orders_total"], 1)
        self.assertEqual(metrics["orders_pending"], 1)
        self.assertEqual(metrics["revenue_total"], "240.00")
        self.assertEqual(metrics["average_order_value"], "240.00")
        self.assertEqual(metrics["users_total"], 2)
        self.assertEqual(metrics["users_customers"], 1)
        self.assertEqual(metrics["users_admins"], 1)
        self.assertEqual(metrics["products_total"], 1)
        self.assertEqual(metrics["products_active"], 1)
        self.assertEqual(metrics["categories_active"], 1)
        self.assertEqual(metrics["awaiting_payment"], 0)

        self.assertEqual(len(response.data["recent_orders"]), 1)
        self.assertEqual(response.data["recent_orders"][0]["order_number"], order.order_number)

    def test_dashboard_lists_low_stock_products(self):
        self.product.stock = 3
        self.product.save(update_fields=["stock"])

        response = self.admin_client.get("/api/admin/dashboard/")
        low_stock = response.data["low_stock_products"]
        self.assertEqual(len(low_stock), 1)
        self.assertEqual(low_stock[0]["id"], str(self.product.pk))
        self.assertEqual(low_stock[0]["stock"], 3)
        self.assertEqual(response.data["metrics"]["low_stock"], 1)

    def test_dashboard_metrics_are_strings_not_floats(self):
        response = self.admin_client.get("/api/admin/dashboard/")
        self.assertIsInstance(response.data["metrics"]["revenue_total"], str)


class AdminOrderListTests(AdminOrderTestCase):
    def test_admin_sees_every_customers_orders(self):
        other = create_profile(email="other@example.com")
        self.place_order()
        self.place_order(quantity=2, client=auth_client(other))

        response = self.admin_client.get("/api/admin/orders/")
        self.assertEqual(response.status_code, status.HTTP_200_OK, msg=response.data)
        self.assertEqual(response.data["count"], 2)

    def test_customer_cannot_list_admin_orders(self):
        response = self.customer_client.get("/api/admin/orders/")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_admin_order_list_can_be_filtered(self):
        first = self.place_order()
        # Distinct full name too: `search` spans email and name.
        other = create_profile(email="other@example.com", full_name="Other Person")
        self.place_order(quantity=2, client=auth_client(other))

        response = self.admin_client.get(
            f"/api/admin/orders/?status={OrderStatus.PENDING}"
        )
        self.assertEqual(response.data["count"], 2)

        response = self.admin_client.get(f"/api/admin/orders/?user={first.user_id}")
        self.assertEqual(response.data["count"], 1)

        response = self.admin_client.get("/api/admin/orders/?search=shopper")
        self.assertEqual(response.data["count"], 1)
        self.assertEqual(response.data["results"][0]["order_number"], first.order_number)

        response = self.admin_client.get("/api/admin/orders/?search=other@example.com")
        self.assertEqual(response.data["count"], 1)


class AdminStatusUpdateTests(AdminOrderTestCase):
    def test_admin_can_advance_an_order_through_the_lifecycle(self):
        order = self.place_order()
        for target in (
            OrderStatus.CONFIRMED,
            OrderStatus.PROCESSING,
            OrderStatus.SHIPPED,
            OrderStatus.DELIVERED,
        ):
            response = self.admin_client.patch(
                f"/api/admin/orders/{order.id}/status/", {"status": target}, format="json"
            )
            self.assertEqual(response.status_code, status.HTTP_200_OK, msg=response.data)
            self.assertEqual(response.data["status"], target)
            order.refresh_from_db()
            self.assertEqual(order.status, target)

    def test_illegal_transition_is_rejected(self):
        order = self.place_order()
        response = self.admin_client.patch(
            f"/api/admin/orders/{order.id}/status/",
            {"status": OrderStatus.DELIVERED},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data["error"]["code"], "invalid_status_transition")
        details = response.data["error"]["details"]
        self.assertEqual(details["current_status"], OrderStatus.PENDING)
        self.assertIn(OrderStatus.CONFIRMED, details["allowed"])
        order.refresh_from_db()
        self.assertEqual(order.status, OrderStatus.PENDING)

    def test_a_delivered_order_cannot_move_again(self):
        order = self.place_order()
        OrderService.transition(order, OrderStatus.CONFIRMED)
        for target in (OrderStatus.PROCESSING, OrderStatus.SHIPPED, OrderStatus.DELIVERED):
            OrderService.transition(Order.objects.get(pk=order.pk), target)

        response = self.admin_client.patch(
            f"/api/admin/orders/{order.id}/status/",
            {"status": OrderStatus.PENDING},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_admin_can_cancel_an_order(self):
        order = self.place_order(quantity=2)
        response = self.admin_client.post(f"/api/admin/orders/{order.id}/cancel/")
        self.assertEqual(response.status_code, status.HTTP_200_OK, msg=response.data)
        self.assertEqual(response.data["status"], OrderStatus.CANCELLED)
        self.product.refresh_from_db()
        self.assertEqual(self.product.stock, 50)

    def test_payment_status_can_be_recorded_alongside_a_status_change(self):
        order = self.place_order()
        response = self.admin_client.patch(
            f"/api/admin/orders/{order.id}/status/",
            {"status": OrderStatus.CONFIRMED, "payment_status": PaymentStatus.PAID},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK, msg=response.data)
        order.refresh_from_db()
        self.assertEqual(order.payment_status, PaymentStatus.PAID)

    def test_customer_cannot_change_order_status(self):
        order = self.place_order()
        response = self.customer_client.patch(
            f"/api/admin/orders/{order.id}/status/",
            {"status": OrderStatus.CONFIRMED},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        order.refresh_from_db()
        self.assertEqual(order.status, OrderStatus.PENDING)

    def test_invalid_status_value_is_rejected(self):
        order = self.place_order()
        response = self.admin_client.patch(
            f"/api/admin/orders/{order.id}/status/", {"status": "teleported"}, format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("status", response.data["error"]["details"])


class AdminProductApiTests(AdminOrderTestCase):
    def test_admin_list_includes_inactive_products(self):
        hidden = create_product(
            category=self.category, name="Hidden", sku="HID-1", is_active=False
        )
        response = self.admin_client.get("/api/admin/products/")
        self.assertEqual(response.status_code, status.HTTP_200_OK, msg=response.data)
        self.assertIn(str(hidden.pk), {str(row["id"]) for row in response.data["results"]})

    def test_customer_cannot_use_the_admin_product_endpoint(self):
        response = self.customer_client.get("/api/admin/products/")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_admin_product_summary(self):
        response = self.admin_client.get("/api/admin/products/summary/")
        self.assertEqual(response.status_code, status.HTTP_200_OK, msg=response.data)
        self.assertEqual(response.data["total"], 1)
        self.assertEqual(response.data["active"], 1)
        self.assertEqual(response.data["units_in_stock"], 50)
        self.assertEqual(response.data["inventory_value"], "6000.00")

    def test_admin_product_list_orders_by_units_sold(self):
        self.place_order(quantity=3)
        response = self.admin_client.get("/api/admin/products/?ordering=-units_sold")
        self.assertEqual(response.status_code, status.HTTP_200_OK, msg=response.data)
        self.assertEqual(response.data["results"][0]["id"], str(self.product.pk))