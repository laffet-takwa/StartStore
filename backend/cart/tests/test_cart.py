"""Cart contents, ownership and availability rules."""

from __future__ import annotations

from decimal import Decimal

from django.conf import settings
from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient

from cart.models import Cart, CartItem
from common.testing import auth_client, create_category, create_product, create_profile


class CartAccessTests(TestCase):
    def setUp(self) -> None:
        self.user = create_profile(email="shopper@example.com")
        self.client = auth_client(self.user)

    def test_cart_requires_authentication(self):
        response = APIClient().get("/api/cart/")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_cart_is_created_on_first_access(self):
        response = self.client.get("/api/cart/")
        self.assertEqual(response.status_code, status.HTTP_200_OK, msg=response.data)
        self.assertEqual(response.data["items"], [])
        self.assertEqual(response.data["subtotal"], "0.00")
        self.assertTrue(Cart.objects.filter(user=self.user).exists())

    def test_a_user_never_gets_someone_elses_cart(self):
        other = create_profile(email="other@example.com")
        auth_client(other).post("/api/cart/items/", {"product_id": 1, "quantity": 1}, format="json")
        response = self.client.get("/api/cart/")
        self.assertEqual(response.data["items"], [])
        self.assertEqual(Cart.objects.count(), 1)


class CartItemTests(TestCase):
    def setUp(self) -> None:
        self.category = create_category("Electronics")
        self.product = create_product(
            category=self.category, name="Keyboard", sku="KB-1", price="120.00", stock=10
        )
        self.user = create_profile(email="shopper@example.com")
        self.client = auth_client(self.user)

    def add(self, product=None, quantity=1):
        return self.client.post(
            "/api/cart/items/",
            {"product_id": (product or self.product).id, "quantity": quantity},
            format="json",
        )

    def test_add_item(self):
        response = self.add(quantity=2)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED, msg=response.data)
        self.assertEqual(response.data["quantity"], 2)
        self.assertEqual(response.data["unit_price"], "120.00")
        self.assertEqual(response.data["line_total"], "240.00")
        self.assertTrue(response.data["is_available"])
        self.assertEqual(response.data["product"]["name"], "Keyboard")

    def test_adding_the_same_product_tops_up_the_line(self):
        self.add(quantity=2)
        response = self.add(quantity=3)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED, msg=response.data)
        self.assertEqual(response.data["quantity"], 5)
        self.assertEqual(CartItem.objects.count(), 1)

    def test_line_total_uses_the_discount_price(self):
        discounted = create_product(
            category=self.category, name="Monitor", sku="MON-1",
            price="200.00", discount_price="150.00", stock=5,
        )
        response = self.add(product=discounted, quantity=2)
        self.assertEqual(response.data["unit_price"], "150.00")
        self.assertEqual(response.data["line_total"], "300.00")

    def test_quantity_must_be_greater_than_zero(self):
        for bad in (0, -2):
            with self.subTest(quantity=bad):
                response = self.add(quantity=bad)
                self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
                self.assertEqual(CartItem.objects.count(), 0)

    def test_quantity_above_stock_is_rejected(self):
        response = self.add(quantity=11)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data["error"]["code"], "insufficient_stock")
        self.assertEqual(
            response.data["error"]["details"]["items"][0]["available_quantity"], 10
        )
        self.assertEqual(CartItem.objects.count(), 0)

    def test_inactive_product_cannot_be_added(self):
        hidden = create_product(
            category=self.category, name="Old", sku="OLD-1", is_active=False
        )
        response = self.add(product=hidden)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data["error"]["code"], "product_unavailable")

    def test_unknown_product_is_rejected(self):
        response = self.client.post(
            "/api/cart/items/", {"product_id": 999999, "quantity": 1}, format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_update_line_quantity(self):
        self.add(quantity=2)
        item_id = CartItem.objects.get().pk
        response = self.client.patch(
            f"/api/cart/items/{item_id}/", {"quantity": 7}, format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK, msg=response.data)
        self.assertEqual(response.data["quantity"], 7)

    def test_update_above_stock_is_rejected(self):
        self.add(quantity=2)
        item_id = CartItem.objects.get().pk
        response = self.client.patch(
            f"/api/cart/items/{item_id}/", {"quantity": 99}, format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data["error"]["code"], "insufficient_stock")
        CartItem.objects.get().refresh_from_db()
        self.assertEqual(CartItem.objects.get().quantity, 2)

    def test_update_to_zero_quantity_is_rejected(self):
        self.add()
        item_id = CartItem.objects.get().pk
        response = self.client.patch(
            f"/api/cart/items/{item_id}/", {"quantity": 0}, format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_remove_line(self):
        self.add()
        item_id = CartItem.objects.get().pk
        response = self.client.delete(f"/api/cart/items/{item_id}/")
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(CartItem.objects.count(), 0)

    def test_list_items(self):
        other = create_product(category=self.category, name="Mouse", sku="MS-1", price="25.00")
        self.add(quantity=2)
        self.add(product=other, quantity=1)
        response = self.client.get("/api/cart/items/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["count"], 2)

    def test_cannot_touch_another_customers_cart_item(self):
        intruder = create_profile(email="intruder@example.com")
        self.add(quantity=2)
        item_id = CartItem.objects.get().pk

        response = auth_client(intruder).patch(
            f"/api/cart/items/{item_id}/", {"quantity": 1}, format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

        response = auth_client(intruder).delete(f"/api/cart/items/{item_id}/")
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

        CartItem.objects.get().refresh_from_db()
        self.assertEqual(CartItem.objects.get().quantity, 2, "quantity must be untouched")

    def test_cart_item_requires_authentication(self):
        response = APIClient().post(
            "/api/cart/items/", {"product_id": self.product.id, "quantity": 1}, format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class CartTotalsTests(TestCase):
    def setUp(self) -> None:
        self.category = create_category("Electronics")
        self.user = create_profile(email="shopper@example.com")
        self.client = auth_client(self.user)

    def test_totals_are_computed_server_side(self):
        product = create_product(
            category=self.category, name="Keyboard", sku="KB-1", price="40.00", stock=10
        )
        self.client.post(
            "/api/cart/items/", {"product_id": product.id, "quantity": 3}, format="json"
        )

        response = self.client.get("/api/cart/")
        self.assertEqual(response.data["subtotal"], "120.00")
        self.assertEqual(response.data["total_items"], 3)
        # Compare against the configured store currency rather than a literal, so
        # the test does not encode the operator's currency choice.
        self.assertEqual(response.data["currency"], settings.STARTSTORE_CURRENCY)
        # 120.00 is above the default free-shipping threshold.
        self.assertEqual(response.data["shipping_cost"], "0.00")
        self.assertEqual(response.data["total"], "120.00")

    def test_shipping_is_charged_below_the_threshold(self):
        product = create_product(
            category=self.category, name="Cable", sku="CB-1", price="10.00", stock=10
        )
        self.client.post(
            "/api/cart/items/", {"product_id": product.id, "quantity": 1}, format="json"
        )

        response = self.client.get("/api/cart/")
        self.assertEqual(response.data["subtotal"], "10.00")
        self.assertEqual(response.data["shipping_cost"], "9.99")
        self.assertEqual(response.data["total"], "19.99")

    def test_emptying_the_cart(self):
        product = create_product(category=self.category, sku="CB-1", price="10.00", stock=10)
        self.client.post(
            "/api/cart/items/", {"product_id": product.id, "quantity": 1}, format="json"
        )

        response = self.client.delete("/api/cart/")
        self.assertEqual(response.status_code, status.HTTP_200_OK, msg=response.data)
        self.assertEqual(response.data["items"], [])
        self.assertEqual(CartItem.objects.count(), 0)

    def test_cart_item_model_totals(self):
        cart = Cart.objects.create(user=self.user)
        product = create_product(
            category=self.category, sku="CB-1", price="10.00", stock=10
        )
        CartItem.objects.create(cart=cart, product=product, quantity=2)
        self.assertEqual(cart.subtotal, Decimal("20.00"))
        self.assertEqual(cart.total_items, 2)