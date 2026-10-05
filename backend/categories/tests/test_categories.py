"""Category visibility and admin-only management."""

from __future__ import annotations

from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient

from categories.models import Category
from common.testing import auth_client, create_admin, create_category, create_product, create_profile


class CategoryReadTests(TestCase):
    def setUp(self) -> None:
        self.client = APIClient()
        self.active = create_category("Electronics")
        self.retired = create_category("Retired", is_active=False)
        create_product(category=self.active, sku="KB-1")
        create_product(category=self.active, sku="MON-1", is_active=False)

    def test_public_list_hides_inactive_categories(self):
        response = self.client.get("/api/categories/")
        self.assertEqual(response.status_code, status.HTTP_200_OK, msg=response.data)
        names = {row["name"] for row in response.data["results"]}
        self.assertEqual(names, {"Electronics"})

    def test_admin_list_includes_inactive_categories(self):
        response = auth_client(create_admin()).get("/api/categories/")
        names = {row["name"] for row in response.data["results"]}
        self.assertEqual(names, {"Electronics", "Retired"})

    def test_product_count_counts_only_active_products(self):
        response = self.client.get("/api/categories/")
        row = response.data["results"][0]
        self.assertEqual(row["product_count"], 1)

    def test_slug_is_generated_from_the_name(self):
        self.assertEqual(self.active.slug, "electronics")

    def test_search_filters_by_name(self):
        response = self.client.get("/api/categories/?search=electro")
        self.assertEqual(response.data["count"], 1)

    def test_retrieve_inactive_category_is_404_for_public(self):
        response = self.client.get(f"/api/categories/{str(self.retired.id)}/")
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_retrieve_active_category_is_public(self):
        response = self.client.get(f"/api/categories/{str(self.active.id)}/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)


class CategoryWriteTests(TestCase):
    def setUp(self) -> None:
        self.admin_client = auth_client(create_admin())
        self.customer_client = auth_client(create_profile(email="shopper@example.com"))

    def test_anonymous_cannot_create(self):
        response = APIClient().post("/api/categories/", {"name": "Ghost"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertEqual(Category.objects.count(), 0)

    def test_customer_cannot_create(self):
        response = self.customer_client.post("/api/categories/", {"name": "Mine"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(Category.objects.count(), 0)

    def test_admin_can_create(self):
        response = self.admin_client.post(
            "/api/categories/", {"name": "Books", "description": "Fiction"}, format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED, msg=response.data)
        self.assertEqual(response.data["slug"], "books")

    def test_duplicate_names_are_allowed_and_slugs_stay_unique(self):
        """`categories.name` is not unique in the schema; only `slug` is."""
        create_category("Books")
        response = self.admin_client.post(
            "/api/categories/", {"name": "Books"}, format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED, msg=response.data)
        self.assertNotEqual(response.data["slug"], "books")
        self.assertEqual(response.data["name"], "Books")

    def test_slug_is_server_owned(self):
        """`slug` is read-only: a client value is ignored, not honoured."""
        response = self.admin_client.post(
            "/api/categories/", {"name": "Garden", "slug": "hand-picked"}, format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED, msg=response.data)
        self.assertEqual(response.data["slug"], "garden")

    def test_renaming_keeps_the_slug_stable(self):
        category = create_category("Books")
        response = self.admin_client.patch(
            f"/api/categories/{category.pk}/", {"name": "Literature"}, format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK, msg=response.data)
        self.assertEqual(response.data["slug"], "books", "public URLs must stay stable")
        self.assertEqual(response.data["name"], "Literature")

    def test_admin_can_update(self):
        category = create_category("Books")
        response = self.admin_client.patch(
            f"/api/categories/{category.id}/", {"description": "Updated"}, format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK, msg=response.data)
        category.refresh_from_db()
        self.assertEqual(category.description, "Updated")

    def test_delete_soft_deletes_and_keeps_products(self):
        category = create_category("Books")
        product = create_product(category=category, sku="BK-1")

        response = self.admin_client.delete(f"/api/categories/{category.id}/")
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

        category.refresh_from_db()
        self.assertFalse(category.is_active)
        self.assertTrue(Category.objects.filter(pk=category.pk).exists())
        self.assertTrue(product.__class__.objects.filter(pk=product.pk).exists())
        self.assertEqual(
            APIClient().get(f"/api/categories/{category.id}/").status_code,
            status.HTTP_404_NOT_FOUND,
        )

    def test_customer_cannot_delete(self):
        category = create_category("Books")
        response = self.customer_client.delete(f"/api/categories/{category.id}/")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        category.refresh_from_db()
        self.assertTrue(category.is_active)

    def test_has_products_filter(self):
        with_products = create_category("WithItems")
        create_category("Empty")
        create_product(category=with_products, sku="IT-1")

        response = self.admin_client.get("/api/categories/?has_products=true")
        self.assertEqual(
            [row["name"] for row in response.data["results"]], ["WithItems"]
        )

        response = self.admin_client.get("/api/categories/?has_products=false")
        self.assertEqual([row["name"] for row in response.data["results"]], ["Empty"])