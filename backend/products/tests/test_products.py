"""Product catalogue: reads, filtering, admin writes and soft deletes."""

from __future__ import annotations

from decimal import Decimal

from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient

from common.testing import auth_client, create_admin, create_category, create_product, create_profile
from products.models import Product, ProductImage


class ProductReadTests(TestCase):
    def setUp(self) -> None:
        self.client = APIClient()
        self.electronics = create_category("Electronics")
        self.clothing = create_category("Clothing")
        self.keyboard = create_product(
            category=self.electronics, name="Mechanical Keyboard", sku="KB-1",
            price="120.00", stock=10,
        )
        self.discounted = create_product(
            category=self.electronics, name="Studio Monitor", sku="MON-1",
            price="200.00", discount_price="150.00", stock=0,
        )
        self.jacket = create_product(
            category=self.clothing, name="Rain Jacket", sku="JKT-1", price="60.00", stock=4
        )
        self.hidden = create_product(
            category=self.electronics, name="Discontinued", sku="OLD-1",
            price="10.00", stock=5, is_active=False,
        )

    def test_anonymous_list_returns_only_active_products(self):
        response = self.client.get("/api/products/")
        self.assertEqual(response.status_code, status.HTTP_200_OK, msg=response.data)
        ids = {str(row["id"]) for row in response.data["results"]}
        self.assertEqual(ids, {str(self.keyboard.id), str(self.discounted.id), str(self.jacket.id)})
        self.assertNotIn(self.hidden.id, ids)

    def test_admin_list_includes_inactive_products(self):
        response = auth_client(create_admin()).get("/api/products/")
        ids = {str(row["id"]) for row in response.data["results"]}
        self.assertIn(str(self.hidden.id), ids)

    def test_list_payload_contains_derived_pricing(self):
        response = self.client.get("/api/products/")
        row = next(
            r for r in response.data["results"] if r["id"] == str(self.discounted.id)
        )
        self.assertEqual(row["final_price"], "150.00")
        self.assertTrue(row["is_on_sale"])
        self.assertFalse(row["in_stock"])

    def test_retrieve_active_product_is_public(self):
        response = self.client.get(f"/api/products/{str(self.keyboard.id)}/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["sku"], "KB-1")
        self.assertEqual(response.data["category"]["name"], "Electronics")

    def test_retrieve_inactive_product_is_404_for_public(self):
        response = self.client.get(f"/api/products/{str(self.hidden.id)}/")
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_admin_can_retrieve_inactive_product(self):
        response = auth_client(create_admin()).get(f"/api/products/{str(self.hidden.id)}/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)


class ProductFilterTests(TestCase):
    def setUp(self) -> None:
        self.client = APIClient()
        self.electronics = create_category("Electronics")
        self.clothing = create_category("Clothing")
        self.keyboard = create_product(
            category=self.electronics, name="Mechanical Keyboard", sku="KB-1",
            price="120.00", stock=10,
        )
        self.monitor = create_product(
            category=self.electronics, name="Studio Monitor", sku="MON-1",
            price="200.00", discount_price="150.00", stock=2,
        )
        self.jacket = create_product(
            category=self.clothing, name="Rain Jacket", sku="JKT-1", price="60.00", stock=0
        )

    def ids(self, query: str) -> set:
        response = self.client.get(f"/api/products/{query}")
        self.assertEqual(response.status_code, status.HTTP_200_OK, msg=response.data)
        return {str(row["id"]) for row in response.data["results"]}

    def test_filter_by_category_slug(self):
        self.assertEqual(
            self.ids("?category=clothing"), {str(self.jacket.id)}
        )

    def test_filter_by_category_id(self):
        self.assertEqual(
            self.ids(f"?category={str(self.electronics.id)}"),
            {str(self.keyboard.id), str(self.monitor.id)},
        )

    def test_filter_by_unknown_category_returns_empty(self):
        self.assertEqual(self.ids("?category=nope"), set())

    def test_min_and_max_price_use_the_effective_price(self):
        # The monitor sells for 150.00 after discount, not 200.00.
        self.assertIn(str(self.monitor.id), self.ids("?min_price=140&max_price=160"))
        self.assertNotIn(str(self.monitor.id), self.ids("?min_price=190&max_price=210"))

    def test_price_filter_bounds_are_inclusive(self):
        self.assertIn(str(self.jacket.id), self.ids("?min_price=60&max_price=60"))

    def test_search_matches_name_description_and_sku(self):
        self.assertEqual(self.ids("?search=keyboard"), {str(self.keyboard.id)})
        self.assertEqual(self.ids("?search=JKT"), {str(self.jacket.id)})

    def test_in_stock_true_excludes_sold_out_products(self):
        self.assertEqual(
            self.ids("?in_stock=true"), {str(self.keyboard.id), str(self.monitor.id)}
        )
        self.assertEqual(self.ids("?in_stock=false"), {str(self.jacket.id)})

    def test_is_on_sale_filter(self):
        self.assertEqual(self.ids("?is_on_sale=true"), {str(self.monitor.id)})
        self.assertEqual(
            self.ids("?is_on_sale=false"), {str(self.keyboard.id), str(self.jacket.id)}
        )

    def test_ordering_by_price_ascending_and_descending(self):
        ascending = self.client.get("/api/products/?ordering=price").data["results"]
        self.assertEqual(
            [row["id"] for row in ascending],
            [str(self.jacket.id), str(self.keyboard.id), str(self.monitor.id)],
        )
        descending = self.client.get("/api/products/?ordering=-price").data["results"]
        self.assertEqual(
            [row["id"] for row in descending],
            [str(self.monitor.id), str(self.keyboard.id), str(self.jacket.id)],
        )

    def test_ordering_ignores_unknown_fields(self):
        response = self.client.get("/api/products/?ordering=not_a_field")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_combined_filters(self):
        # Electronics + in stock + effective price at most 160 leaves the
        # discounted monitor (150.00) and the keyboard (120.00).
        result = self.ids("?category=electronics&in_stock=true&max_price=160")
        self.assertEqual(result, {str(self.keyboard.id), str(self.monitor.id)})

    def test_combined_filters_with_a_floor_price(self):
        result = self.ids("?category=electronics&min_price=140&max_price=160")
        self.assertEqual(result, {str(self.monitor.id)})

    def test_pagination_metadata(self):
        response = self.client.get("/api/products/?page_size=2")
        self.assertEqual(response.data["count"], 3)
        self.assertEqual(len(response.data["results"]), 2)
        self.assertIsNotNone(response.data["next"])


class ProductWritePermissionTests(TestCase):
    def setUp(self) -> None:
        self.category = create_category("Electronics")
        self.admin = create_admin()
        self.customer = create_profile(email="shopper@example.com")
        self.payload = {
            "name": "USB-C Hub",
            "sku": "hub-7",
            "price": "39.99",
            "stock": 12,
            "category_id": self.category.id,
        }

    def test_anonymous_cannot_create(self):
        response = APIClient().post("/api/products/", self.payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertEqual(Product.objects.count(), 0)

    def test_customer_cannot_create(self):
        response = auth_client(self.customer).post("/api/products/", self.payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(Product.objects.count(), 0)

    def test_customer_cannot_update_or_delete(self):
        product = create_product(category=self.category)
        client = auth_client(self.customer)
        self.assertEqual(
            client.patch(f"/api/products/{product.id}/", {"price": "1.00"}, format="json").status_code,
            status.HTTP_403_FORBIDDEN,
        )
        self.assertEqual(
            client.delete(f"/api/products/{product.id}/").status_code,
            status.HTTP_403_FORBIDDEN,
        )

    def test_customer_cannot_read_inactive_products(self):
        product = create_product(category=self.category, sku="HID-1", is_active=False)
        response = auth_client(self.customer).get(f"/api/products/{product.id}/")
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)


class ProductWriteTests(TestCase):
    def setUp(self) -> None:
        self.category = create_category("Electronics")
        self.client = auth_client(create_admin())

    def test_admin_can_create_product(self):
        response = self.client.post(
            "/api/products/",
            {
                "name": "USB-C Hub",
                "sku": "hub-7",
                "price": "39.99",
                "stock": 12,
                "category_id": self.category.id,
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED, msg=response.data)
        product = Product.objects.get(pk=response.data["id"])
        self.assertEqual(product.sku, "HUB-7", "SKU must be normalised to uppercase")
        self.assertEqual(product.slug, "usb-c-hub", "slug must be generated")
        self.assertTrue(product.is_active)

    def test_discount_below_price_is_accepted(self):
        response = self.client.post(
            "/api/products/",
            {
                "name": "Headphones",
                "sku": "HP-1",
                "price": "300.00",
                "discount_price": "199.99",
                "stock": 5,
                "category_id": self.category.id,
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED, msg=response.data)
        self.assertEqual(response.data["final_price"], "199.99")
        self.assertTrue(response.data["is_on_sale"])

    def test_discount_at_or_above_price_is_rejected(self):
        for index, bad_discount in enumerate(("300.00", "350.00"), start=1):
            with self.subTest(discount=bad_discount):
                response = self.client.post(
                    "/api/products/",
                    {
                        "name": "Bad Discount",
                        "sku": f"BAD{index}",
                        "price": "300.00",
                        "discount_price": bad_discount,
                        "stock": 5,
                        "category_id": self.category.id,
                    },
                    format="json",
                )
                self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
                self.assertIn("discount_price", response.data["error"]["details"])

    def test_zero_or_negative_price_is_rejected(self):
        for index, bad_price in enumerate(("0", "-5.00"), start=1):
            with self.subTest(price=bad_price):
                response = self.client.post(
                    "/api/products/",
                    {
                        "name": "Bad Price",
                        "sku": f"PRICE{index}",
                        "price": bad_price,
                        "stock": 1,
                        "category_id": self.category.id,
                    },
                    format="json",
                )
                self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_category_is_optional_because_the_column_is_nullable(self):
        """`products.category_id` is NULL-able, so omitting it must succeed."""
        response = self.client.post(
            "/api/products/",
            {"name": "No Category", "sku": "NOCAT-1", "price": "10.00", "stock": 1},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED, msg=response.data)
        self.assertIsNone(response.data["category"])

    def test_unknown_category_id_is_rejected(self):
        import uuid as uuid_module

        response = self.client.post(
            "/api/products/",
            {
                "name": "Bad Category",
                "sku": "BADCAT-1",
                "price": "10.00",
                "stock": 1,
                "category_id": uuid_module.uuid4(),
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("category_id", response.data["error"]["details"])

    def test_a_product_can_be_uncategorised_afterwards(self):
        product = create_product(category=self.category, sku="UNCAT-1")
        response = self.client.patch(
            f"/api/products/{product.pk}/", {"category_id": None}, format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK, msg=response.data)
        product.refresh_from_db()
        self.assertIsNone(product.category)

    def test_negative_stock_is_rejected(self):
        response = self.client.post(
            "/api/products/",
            {
                "name": "Bad Stock",
                "sku": "BADSTOCK",
                "price": "10.00",
                "stock": -3,
                "category_id": self.category.id,
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_duplicate_sku_is_rejected(self):
        create_product(category=self.category, sku="DUP-1")
        response = self.client.post(
            "/api/products/",
            {"name": "Copy", "sku": "dup-1", "price": "10.00", "stock": 1,
             "category_id": self.category.id},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("sku", response.data["error"]["details"])

    def test_product_cannot_be_assigned_to_inactive_category(self):
        create_category("Retired", is_active=False)
        retired = create_category("Retired Two", is_active=False)
        response = self.client.post(
            "/api/products/",
            {"name": "Ghost", "sku": "GHOST-1", "price": "10.00", "stock": 1,
             "category_id": retired.id},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_admin_can_update_price_and_stock(self):
        product = create_product(category=self.category, price="20.00", stock=3)
        response = self.client.patch(
            f"/api/products/{product.id}/", {"price": "17.50", "stock": 8}, format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK, msg=response.data)
        product.refresh_from_db()
        self.assertEqual(product.price, Decimal("17.50"))
        self.assertEqual(product.stock, 8)

    def test_delete_soft_deletes_the_product(self):
        product = create_product(category=self.category)
        response = self.client.delete(f"/api/products/{product.id}/")
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

        product.refresh_from_db()
        self.assertFalse(product.is_active, "row must survive for order history")
        self.assertEqual(
            APIClient().get(f"/api/products/{product.id}/").status_code,
            status.HTTP_404_NOT_FOUND,
        )

    def test_stock_adjustment_modes(self):
        product = create_product(category=self.category, stock=10)

        self.client.patch(
            f"/api/products/{product.id}/stock/", {"stock": 4, "mode": "set"}, format="json"
        )
        product.refresh_from_db()
        self.assertEqual(product.stock, 4)

        self.client.patch(
            f"/api/products/{product.id}/stock/", {"stock": 6, "mode": "increment"}, format="json"
        )
        product.refresh_from_db()
        self.assertEqual(product.stock, 10)

        self.client.patch(
            f"/api/products/{product.id}/stock/", {"stock": 3, "mode": "decrement"}, format="json"
        )
        product.refresh_from_db()
        self.assertEqual(product.stock, 7)

    def test_stock_adjustment_cannot_go_negative(self):
        product = create_product(category=self.category, stock=2)
        response = self.client.patch(
            f"/api/products/{product.id}/stock/", {"stock": 5, "mode": "decrement"}, format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        product.refresh_from_db()
        self.assertEqual(product.stock, 2)

    def test_stock_adjustment_requires_admin(self):
        product = create_product(category=self.category)
        response = auth_client(create_profile(email="c@example.com")).patch(
            f"/api/products/{product.id}/stock/", {"stock": 1}, format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


class ProductImageTests(TestCase):
    def setUp(self) -> None:
        self.product = create_product()
        self.admin_client = auth_client(create_admin())

    def test_admin_can_add_and_list_images(self):
        create = self.admin_client.post(
            f"/api/products/{str(self.product.id)}/images/",
            {"image_url": "https://cdn.example.com/a.jpg", "alt_text": "Front", "display_order": 0},
            format="json",
        )
        self.assertEqual(create.status_code, status.HTTP_201_CREATED, msg=create.data)

        listing = self.admin_client.get(f"/api/products/{str(self.product.id)}/images/")
        self.assertEqual(listing.status_code, status.HTTP_200_OK)
        self.assertEqual(listing.data["count"], 1)

        detail = APIClient().get(f"/api/products/{str(self.product.id)}/")
        self.assertEqual(len(detail.data["images"]), 1)
        self.assertEqual(detail.data["images"][0]["alt_text"], "Front")

    def test_images_are_ordered(self):
        for order, url in ((1, "b"), (0, "a")):
            self.admin_client.post(
                f"/api/products/{str(self.product.id)}/images/",
                {"image_url": f"https://cdn.example.com/{url}.jpg", "display_order": order},
                format="json",
            )
        listing = self.admin_client.get(f"/api/products/{str(self.product.id)}/images/")
        self.assertEqual(
            [row["image_url"] for row in listing.data["results"]],
            ["https://cdn.example.com/a.jpg", "https://cdn.example.com/b.jpg"],
        )

    def test_customer_cannot_manage_images(self):
        response = auth_client(create_profile(email="c@example.com")).post(
            f"/api/products/{str(self.product.id)}/images/",
            {"image_url": "https://cdn.example.com/x.jpg"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(ProductImage.objects.count(), 0)

    def test_images_cascade_when_product_row_is_hard_deleted(self):
        self.admin_client.post(
            f"/api/products/{str(self.product.id)}/images/",
            {"image_url": "https://cdn.example.com/a.jpg"},
            format="json",
        )
        self.assertEqual(ProductImage.objects.count(), 1)
        Product.objects.filter(pk=self.product.pk).delete()
        self.assertEqual(ProductImage.objects.count(), 0)