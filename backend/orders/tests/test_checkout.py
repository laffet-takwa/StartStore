"""Checkout: server-side pricing, stock handling and cart cleanup.

These are the highest value tests in the project - they guard the rule that a
client can never influence what it is charged or how much stock is consumed.
"""

from __future__ import annotations

from decimal import Decimal

from django.test import TestCase, override_settings
from rest_framework import status
from rest_framework.test import APIClient

from cart.models import CartItem
from common.constants import OrderStatus, PaymentStatus
from common.testing import (
    auth_client,
    checkout_payload,
    create_address,
    create_category,
    create_product,
    create_profile,
    install_fake_supabase,
)
from orders.models import Order, OrderItem
from orders.services import CheckoutService


class CheckoutTestCase(TestCase):
    """Shared fixture: one category, two products and a cart-owning customer."""

    def setUp(self) -> None:
        install_fake_supabase()
        self.category = create_category("Electronics")
        self.keyboard = create_product(
            category=self.category,
            name="Mechanical Keyboard",
            sku="KB-1",
            price="120.00",
            stock=10,
        )
        self.mouse = create_product(
            category=self.category,
            name="Mouse",
            sku="MS-1",
            price="30.00",
            discount_price="25.00",
            stock=4,
        )
        self.profile = create_profile(email="shopper@example.com")
        self.client = auth_client(self.profile)

    def fill_cart(self, product=None, quantity=1):
        response = self.client.post(
            "/api/cart/items/",
            {"product_id": str((product or self.keyboard).id), "quantity": quantity},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED, msg=response.data)
        return response

    def checkout(self, payload=None):
        # `{}` is a valid (invalid-request) payload, so an explicit `None` check
        # is required here - a truthiness default would silently substitute.
        body = checkout_payload() if payload is None else payload
        return self.client.post("/api/orders/", body, format="json")


class CheckoutAuthTests(CheckoutTestCase):
    def test_checkout_requires_authentication(self):
        response = APIClient().post("/api/orders/", checkout_payload(), format="json")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertEqual(Order.objects.count(), 0)


class CheckoutValidationTests(CheckoutTestCase):
    def test_empty_cart_cannot_be_checked_out(self):
        response = self.checkout()
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data["error"]["code"], "empty_cart")
        self.assertEqual(Order.objects.count(), 0)

    def test_a_destination_is_required(self):
        self.fill_cart()
        response = self.checkout({})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST, msg=response.data)
        self.assertEqual(Order.objects.count(), 0)

    def test_cannot_send_both_a_saved_id_and_an_inline_address(self):
        address = create_address(self.profile)
        self.fill_cart()

        response = self.checkout(
            {
                "shipping_address_id": str(address.pk),
                "shipping_address": checkout_payload()["shipping_address"],
            }
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("shipping_address_id", response.data["error"]["details"])
        self.assertEqual(Order.objects.count(), 0)

    def test_inline_address_fields_are_validated(self):
        self.fill_cart()
        response = self.checkout(checkout_payload(city=""))
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        # Nested serializer errors are reported under the parent field name.
        self.assertIn("city", response.data["error"]["details"]["shipping_address"])
        self.assertEqual(Order.objects.count(), 0)

    def test_invalid_phone_is_rejected(self):
        self.fill_cart()
        response = self.checkout(checkout_payload(phone="abc"))
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("phone", response.data["error"]["details"]["shipping_address"])

    def test_country_must_be_a_two_letter_code(self):
        self.fill_cart()
        response = self.checkout(checkout_payload(country="United Kingdom"))
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("country", response.data["error"]["details"]["shipping_address"])

    def test_country_is_normalised_to_upper_case(self):
        self.fill_cart()
        response = self.checkout(checkout_payload(country="gb"))
        self.assertEqual(response.status_code, status.HTTP_201_CREATED, msg=response.data)
        self.assertEqual(Order.objects.get().shipping_address["country"], "GB")

    def test_client_supplied_prices_are_ignored(self):
        self.fill_cart(quantity=2)
        payload = checkout_payload()
        payload.update(
            {
                "subtotal": "0.01",
                "shipping_cost": "0.00",
                "total": "0.01",
                "status": "delivered",
            }
        )
        response = self.checkout(payload)

        self.assertEqual(response.status_code, status.HTTP_201_CREATED, msg=response.data)
        order = Order.objects.get()
        self.assertEqual(order.subtotal, Decimal("240.00"))
        self.assertEqual(order.total, Decimal("240.00"))
        self.assertEqual(order.status, OrderStatus.PENDING)


class CheckoutSavedAddressTests(CheckoutTestCase):
    def test_checkout_with_a_saved_shipping_address_id(self):
        """The payload the frontend sends after the integration change."""
        address = create_address(self.profile, is_default=True)
        self.fill_cart()

        response = self.checkout(
            {"shipping_address_id": str(address.pk), "payment_method": "card"}
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED, msg=response.data)

        stored = Order.objects.get().shipping_address
        self.assertEqual(stored["address_line"], address.address_line)
        self.assertEqual(stored["country"], "GB")

    def test_payment_method_is_accepted_and_not_persisted(self):
        address = create_address(self.profile)
        self.fill_cart()

        response = self.checkout(
            {"shipping_address_id": str(address.pk), "payment_method": "pay_on_delivery"}
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED, msg=response.data)
        # The schema has no payment_method column; the order stays pending.
        self.assertEqual(Order.objects.get().payment_status, PaymentStatus.PENDING)

    def test_unknown_payment_method_is_rejected(self):
        address = create_address(self.profile)
        self.fill_cart()

        response = self.checkout(
            {"shipping_address_id": str(address.pk), "payment_method": "goat"}
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("payment_method", response.data["error"]["details"])

    def test_legacy_address_id_still_works(self):
        """Older clients keep working; the alias is collapsed, not broken."""
        address = create_address(self.profile)
        self.fill_cart()

        response = self.checkout({"address_id": str(address.pk)})
        self.assertEqual(response.status_code, status.HTTP_201_CREATED, msg=response.data)

    def test_sending_both_destination_shapes_is_rejected(self):
        address = create_address(self.profile)
        self.fill_cart()

        response = self.checkout(
            {
                "shipping_address_id": str(address.pk),
                "shipping_address": checkout_payload()["shipping_address"],
            }
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("shipping_address_id", response.data["error"]["details"])

    def test_checkout_with_a_saved_address_id(self):
        address = create_address(self.profile, is_default=True)
        self.fill_cart()

        response = self.checkout({"shipping_address_id": str(address.pk)})
        self.assertEqual(response.status_code, status.HTTP_201_CREATED, msg=response.data)

        stored = Order.objects.get().shipping_address
        self.assertEqual(stored["address_line"], address.address_line)
        self.assertEqual(stored["city"], "London")
        self.assertEqual(stored["country"], "GB")

    def test_cannot_check_out_with_another_profiles_address(self):
        stranger = create_profile(email="stranger@example.com")
        their_address = create_address(stranger)
        self.fill_cart()

        response = self.checkout({"address_id": str(their_address.pk)})
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(Order.objects.count(), 0)

    def test_unknown_address_id_is_404(self):
        import uuid as uuid_module

        self.fill_cart()
        response = self.checkout({"address_id": str(uuid_module.uuid4())})
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_incomplete_saved_address_blocks_checkout(self):
        """The columns are nullable, so a half-filled address must not ship."""
        address = create_address(self.profile, city=None, postal_code=None)
        self.fill_cart()

        response = self.checkout({"address_id": str(address.pk)})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data["error"]["code"], "shipping_address_incomplete")
        self.assertEqual(
            sorted(response.data["error"]["details"]["missing"]), ["city", "postal_code"]
        )
        self.assertEqual(Order.objects.count(), 0)


class CheckoutStockTests(CheckoutTestCase):
    def test_insufficient_stock_is_rejected_and_nothing_changes(self):
        self.fill_cart(quantity=10)
        self.keyboard.stock = 5
        self.keyboard.save(update_fields=["stock"])

        response = self.checkout()
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data["error"]["code"], "insufficient_stock")
        details = response.data["error"]["details"]["items"][0]
        self.assertEqual(details["product_id"], str(self.keyboard.pk))
        self.assertEqual(details["requested_quantity"], 10)
        self.assertEqual(details["available_quantity"], 5)

        self.assertEqual(Order.objects.count(), 0, "no order may be created")
        self.assertEqual(CartItem.objects.count(), 1, "cart must survive a failure")
        self.keyboard.refresh_from_db()
        self.assertEqual(self.keyboard.stock, 5, "stock must be untouched")

    def test_deactivated_product_blocks_checkout(self):
        self.fill_cart()
        self.keyboard.is_active = False
        self.keyboard.save(update_fields=["is_active"])

        response = self.checkout()
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data["error"]["code"], "product_unavailable")
        self.assertEqual(Order.objects.count(), 0)

    def test_out_of_stock_product_blocks_checkout(self):
        self.fill_cart()
        self.keyboard.stock = 0
        self.keyboard.save(update_fields=["stock"])

        response = self.checkout()
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data["error"]["code"], "insufficient_stock")
        self.assertEqual(Order.objects.count(), 0)

    def test_checkout_decrements_stock(self):
        self.fill_cart(quantity=3)
        response = self.checkout()
        self.assertEqual(response.status_code, status.HTTP_201_CREATED, msg=response.data)
        self.keyboard.refresh_from_db()
        self.assertEqual(self.keyboard.stock, 7)

    def test_checkout_consumes_exactly_available_stock(self):
        self.fill_cart(quantity=10)
        response = self.checkout()
        self.assertEqual(response.status_code, status.HTTP_201_CREATED, msg=response.data)
        self.keyboard.refresh_from_db()
        self.assertEqual(self.keyboard.stock, 0)


class CheckoutSuccessTests(CheckoutTestCase):
    def test_checkout_creates_order_with_server_computed_totals(self):
        self.fill_cart(self.keyboard, quantity=2)
        self.fill_cart(self.mouse, quantity=2)

        response = self.checkout()
        self.assertEqual(response.status_code, status.HTTP_201_CREATED, msg=response.data)

        order = Order.objects.get()
        # 2 x 120.00 + 2 x 25.00 (discounted) = 290.00, above the free threshold.
        self.assertEqual(order.subtotal, Decimal("290.00"))
        self.assertEqual(order.shipping_cost, Decimal("0.00"))
        self.assertEqual(order.total, Decimal("290.00"))
        self.assertEqual(order.status, OrderStatus.PENDING)
        self.assertEqual(order.payment_status, PaymentStatus.PENDING)
        self.assertEqual(order.user, self.profile)
        self.assertTrue(order.order_number.startswith("SS-"))
        self.assertEqual(order.item_count, 4)

        self.assertEqual(response.data["subtotal"], "290.00")
        self.assertEqual(response.data["total"], "290.00")
        self.assertEqual(response.data["shipping_address"]["city"], "London")
        self.assertEqual(len(response.data["items"]), 2)

    def test_order_has_no_currency_column(self):
        """`orders` stores bare decimals; currency is a presentation concern."""
        self.fill_cart()
        self.checkout()
        self.assertNotIn("currency", {f.name for f in Order._meta.get_fields()})
        self.assertNotIn("currency", OrderSerializerFields())
        self.assertNotIn("currency", self.checkout().data)

    def test_shipping_cost_is_added_below_the_threshold(self):
        self.fill_cart(self.mouse, quantity=1)  # 25.00 -> under the threshold
        response = self.checkout()
        self.assertEqual(response.status_code, status.HTTP_201_CREATED, msg=response.data)

        order = Order.objects.get()
        self.assertEqual(order.subtotal, Decimal("25.00"))
        self.assertEqual(order.shipping_cost, Decimal("9.99"))
        self.assertEqual(order.total, Decimal("34.99"))

    def test_order_items_snapshot_name_and_price(self):
        self.fill_cart(self.mouse, quantity=2)
        self.checkout()

        item = OrderItem.objects.get()
        self.assertEqual(item.product_name, "Mouse")
        self.assertEqual(item.unit_price, Decimal("25.00"))
        self.assertEqual(item.quantity, 2)
        self.assertEqual(item.subtotal, Decimal("50.00"))
        self.assertEqual(item.product, self.mouse)

    def test_order_item_has_no_sku_or_timestamps(self):
        """`order_items` mirrors the schema: no sku, no created_at/updated_at."""
        self.fill_cart()
        self.checkout()
        field_names = {f.name for f in OrderItem._meta.get_fields()}
        self.assertNotIn("sku", field_names)
        self.assertNotIn("created_at", field_names)
        self.assertNotIn("updated_at", field_names)

    def test_historical_order_survives_catalogue_changes(self):
        self.fill_cart(self.keyboard, quantity=1)
        self.checkout()
        item = OrderItem.objects.get()

        # The product is renamed, repriced and deactivated after the sale.
        self.keyboard.name = "Keyboard Pro Max"
        self.keyboard.price = Decimal("999.00")
        self.keyboard.discount_price = Decimal("1.00")
        self.keyboard.is_active = False
        self.keyboard.save()

        item.refresh_from_db()
        self.assertEqual(item.product_name, "Mechanical Keyboard")
        self.assertEqual(item.unit_price, Decimal("120.00"))
        self.assertEqual(item.subtotal, Decimal("120.00"))

        order = Order.objects.get()
        self.assertEqual(order.total, Decimal("120.00"))

    def test_deleting_a_product_row_leaves_the_order_intact(self):
        self.fill_cart()
        self.checkout()
        item = OrderItem.objects.get()

        # `order_items.product_id` is nullable precisely so this can happen.
        self.keyboard.delete()
        item.refresh_from_db()
        self.assertIsNone(item.product_id)
        self.assertEqual(item.product_name, "Mechanical Keyboard")
        self.assertEqual(Order.objects.count(), 1)

    def test_checkout_empties_the_cart(self):
        self.fill_cart(quantity=2)
        self.checkout()
        self.assertEqual(CartItem.objects.count(), 0)

        cart = self.client.get("/api/cart/")
        self.assertEqual(cart.data["items"], [])

    def test_order_numbers_are_unique(self):
        self.fill_cart(self.keyboard, quantity=1)
        self.checkout()
        self.fill_cart(self.keyboard, quantity=1)
        self.checkout()

        numbers = set(Order.objects.values_list("order_number", flat=True))
        self.assertEqual(len(numbers), 2, "two orders must not share a number")

    def test_checkout_is_idempotent_per_cart_content(self):
        """A second checkout with an emptied cart must fail rather than double charge."""
        self.fill_cart()
        self.assertEqual(self.checkout().status_code, status.HTTP_201_CREATED)
        self.assertEqual(self.checkout().status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(Order.objects.count(), 1)


class CheckoutConcurrencyTests(CheckoutTestCase):
    def test_stock_is_never_decremented_when_availability_changes_mid_checkout(self):
        """Simulates another shopper taking the units between validation and save."""
        self.fill_cart(quantity=5)

        # Steal the stock behind the checkout's back.
        type(self.keyboard).objects.filter(pk=self.keyboard.pk).update(stock=1)

        with self.assertRaises(Exception) as ctx:
            CheckoutService.execute(
                user=self.profile, shipping_address=checkout_payload()["shipping_address"]
            )

        self.assertEqual(getattr(ctx.exception, "code", ""), "insufficient_stock")
        self.assertEqual(Order.objects.count(), 0, "transaction must roll back")
        self.keyboard.refresh_from_db()
        self.assertEqual(self.keyboard.stock, 1, "stock must not be decremented")
        self.assertEqual(CartItem.objects.count(), 1, "cart must be restored")


class StoreConfigurationTests(CheckoutTestCase):
    """Currency and shipping rules must come from settings, never from literals."""

    def test_shipping_rate_follows_settings(self):
        from orders.services import ShippingService

        with override_settings(
            STARTSTORE_FREE_SHIPPING_THRESHOLD=500, STARTSTORE_SHIPPING_FLAT_RATE="4.50"
        ):
            self.assertEqual(ShippingService.cost_for(Decimal("120.00")), Decimal("4.50"))
            self.assertEqual(ShippingService.cost_for(Decimal("500.00")), Decimal("0.00"))

    def test_shipping_rules_apply_to_checkout(self):
        self.fill_cart(self.mouse, quantity=1)  # 25.00
        with override_settings(
            STARTSTORE_FREE_SHIPPING_THRESHOLD=10, STARTSTORE_SHIPPING_FLAT_RATE="2.00"
        ):
            response = self.checkout()

        self.assertEqual(response.status_code, status.HTTP_201_CREATED, msg=response.data)
        order = Order.objects.get()
        self.assertEqual(order.subtotal, Decimal("25.00"))
        self.assertEqual(order.shipping_cost, Decimal("0.00"))
        self.assertEqual(order.total, Decimal("25.00"))


def OrderSerializerFields() -> set[str]:
    """Field names exposed by the order serializer, for the currency assertion."""
    from orders.serializers import OrderSerializer

    return set(OrderSerializer().fields)
