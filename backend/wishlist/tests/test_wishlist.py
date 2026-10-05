"""Wishlist toggling and per-customer isolation."""

from __future__ import annotations

from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient

from common.testing import auth_client, create_category, create_product, create_profile
from wishlist.models import Wishlist


class WishlistTests(TestCase):
    def setUp(self) -> None:
        self.category = create_category("Electronics")
        self.product = create_product(category=self.category, name="Keyboard", sku="KB-1")
        self.other_product = create_product(
            category=self.category, name="Mouse", sku="MS-1"
        )
        self.user = create_profile(email="shopper@example.com")
        self.client = auth_client(self.user)

    def toggle(self, product_id=None):
        return self.client.post(
            "/api/wishlist/toggle/",
            {"product_id": product_id or self.product.id},
            format="json",
        )

    def test_wishlist_requires_authentication(self):
        for response in (
            APIClient().get("/api/wishlist/"),
            APIClient().post("/api/wishlist/toggle/", {"product_id": self.product.id}, format="json"),
            APIClient().delete(f"/api/wishlist/{str(self.product.id)}/"),
        ):
            self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_toggle_adds_then_removes(self):
        response = self.toggle()
        self.assertEqual(response.status_code, status.HTTP_200_OK, msg=response.data)
        self.assertTrue(response.data["in_wishlist"])
        self.assertEqual(response.data["count"], 1)
        self.assertEqual(Wishlist.objects.count(), 1)

        response = self.toggle()
        self.assertFalse(response.data["in_wishlist"])
        self.assertEqual(response.data["count"], 0)
        self.assertEqual(Wishlist.objects.count(), 0)

    def test_toggle_is_idempotent_per_call(self):
        self.toggle()
        self.toggle()
        self.toggle()
        self.assertEqual(Wishlist.objects.count(), 1)

    def test_list_only_returns_own_entries(self):
        intruder = create_profile(email="intruder@example.com")
        auth_client(intruder).post(
            "/api/wishlist/toggle/", {"product_id": self.other_product.id}, format="json"
        )
        self.toggle()

        response = self.client.get("/api/wishlist/")
        self.assertEqual(response.status_code, status.HTTP_200_OK, msg=response.data)
        self.assertEqual(response.data["count"], 1)
        entry = response.data["results"][0]
        self.assertEqual(entry["product"]["name"], "Keyboard")
        self.assertIn("id", entry)
        self.assertIn("created_at", entry)

    def test_delete_by_product_id(self):
        self.toggle()
        response = self.client.delete(f"/api/wishlist/{str(self.product.id)}/")
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(Wishlist.objects.count(), 0)

    def test_delete_unknown_entry_is_404(self):
        response = self.client.delete(f"/api/wishlist/{str(self.product.id)}/")
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_cannot_delete_another_customers_entry(self):
        self.toggle()
        intruder = create_profile(email="intruder@example.com")
        response = auth_client(intruder).delete(f"/api/wishlist/{str(self.product.id)}/")
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(Wishlist.objects.count(), 1)

    def test_toggle_inactive_product_is_404(self):
        hidden = create_product(category=self.category, sku="OLD-1", is_active=False)
        response = self.toggle(product_id=hidden.id)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(Wishlist.objects.count(), 0)

    def test_toggle_unknown_product_is_404(self):
        response = self.toggle(product_id=999999)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_toggle_requires_a_product_id(self):
        response = self.client.post("/api/wishlist/toggle/", {}, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("product_id", response.data["error"]["details"])

    def test_count_reflects_multiple_entries(self):
        self.toggle()
        self.toggle(product_id=self.other_product.id)
        response = self.toggle(product_id=self.other_product.id)
        self.assertFalse(response.data["in_wishlist"])
        self.assertEqual(response.data["count"], 1)

    def test_inactive_product_still_listed_after_delisting(self):
        self.toggle()
        self.product.is_active = False
        self.product.save()

        response = self.client.get("/api/wishlist/")
        self.assertEqual(response.data["count"], 1)
        self.assertEqual(response.data["results"][0]["product"]["name"], "Keyboard")