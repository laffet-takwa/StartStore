"""Staff-only profile management and the saved address book."""

from __future__ import annotations

import uuid

from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient

from accounts.constants import UserRole
from accounts.models import Address
from common.testing import auth_client, create_admin, create_address, create_profile, install_fake_supabase


class AdminProfileListTests(TestCase):
    def setUp(self) -> None:
        install_fake_supabase()
        self.admin = create_admin()
        self.customer = create_profile(email="customer@example.com")

    def test_admin_can_list_profiles_with_counts(self):
        response = auth_client(self.admin).get("/api/admin/users/")
        self.assertEqual(response.status_code, status.HTTP_200_OK, msg=response.data)
        emails = {row["email"] for row in response.data["results"]}
        self.assertIn("customer@example.com", emails)
        self.assertIn("admin@example.com", emails)
        for row in response.data["results"]:
            self.assertIn("order_count", row)
            self.assertIn("address_count", row)

    def test_customer_cannot_list_profiles(self):
        response = auth_client(self.customer).get("/api/admin/users/")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_anonymous_cannot_list_profiles(self):
        self.assertEqual(
            APIClient().get("/api/admin/users/").status_code, status.HTTP_401_UNAUTHORIZED
        )

    def test_filter_by_role(self):
        response = auth_client(self.admin).get("/api/admin/users/?role=customer")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(
            all(row["role"] == UserRole.CUSTOMER for row in response.data["results"])
        )

    def test_search_by_email(self):
        response = auth_client(self.admin).get("/api/admin/users/?search=customer")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["count"], 1)

    def test_admin_can_promote_a_customer(self):
        response = auth_client(self.admin).post(
            f"/api/admin/users/{self.customer.pk}/role/", {"role": "admin"}, format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK, msg=response.data)
        self.customer.refresh_from_db()
        self.assertEqual(self.customer.role, UserRole.ADMIN)
        self.assertTrue(self.customer.is_admin)

    def test_admin_can_demote_a_customer(self):
        other_admin = create_admin(email="boss@example.com")
        response = auth_client(other_admin).post(
            f"/api/admin/users/{self.admin.pk}/role/", {"role": "customer"}, format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK, msg=response.data)
        self.admin.refresh_from_db()
        self.assertEqual(self.admin.role, UserRole.CUSTOMER)

    def test_admin_cannot_demote_themselves(self):
        response = auth_client(self.admin).post(
            f"/api/admin/users/{self.admin.pk}/role/", {"role": "customer"}, format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data["error"]["code"], "self_demotion_forbidden")
        self.admin.refresh_from_db()
        self.assertEqual(self.admin.role, UserRole.ADMIN)

    def test_unknown_role_is_rejected(self):
        response = auth_client(self.admin).post(
            f"/api/admin/users/{self.customer.pk}/role/", {"role": "wizard"}, format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_admin_can_correct_profile_fields(self):
        response = auth_client(self.admin).patch(
            f"/api/admin/users/{self.customer.pk}/",
            {"full_name": "Corrected Name", "phone": "+15550002222"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK, msg=response.data)
        self.customer.refresh_from_db()
        self.assertEqual(self.customer.full_name, "Corrected Name")

    def test_admin_cannot_create_profiles(self):
        """Accounts originate in Supabase Auth, not through this endpoint."""
        response = auth_client(self.admin).post(
            "/api/admin/users/", {"email": "x@example.com"}, format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)


class AddressBookTests(TestCase):
    def setUp(self) -> None:
        install_fake_supabase()
        self.profile = create_profile(email="shopper@example.com")
        self.client = auth_client(self.profile)
        self.other = create_profile(email="other@example.com")

    def payload(self, **overrides) -> dict:
        data = {
            "full_name": "Ada Lovelace",
            "phone": "+15551234567",
            "address_line": "1 Analytical Engine Way",
            "city": "London",
            "postal_code": "EC1A 1BB",
            "country": "GB",
        }
        data.update(overrides)
        return data

    def test_addresses_require_authentication(self):
        for response in (
            APIClient().get("/api/addresses/"),
            APIClient().post("/api/addresses/", self.payload(), format="json"),
        ):
            self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_create_address(self):
        response = self.client.post("/api/addresses/", self.payload(), format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED, msg=response.data)
        self.assertEqual(str(response.data["country"]), "GB")
        self.assertEqual(response.data["user_id"], str(self.profile.pk))
        self.assertTrue(response.data["is_default"], "the first address becomes default")

    def test_country_is_upper_cased(self):
        response = self.client.post(
            "/api/addresses/", self.payload(country="gb"), format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED, msg=response.data)
        self.assertEqual(response.data["country"], "GB")

    def test_address_line_is_required(self):
        response = self.client.post(
            "/api/addresses/", self.payload(address_line=""), format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_long_country_code_is_rejected(self):
        response = self.client.post(
            "/api/addresses/", self.payload(country="GBR"), format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_second_address_is_not_default_by_default(self):
        self.client.post("/api/addresses/", self.payload(address_line="First"), format="json")
        second = self.client.post(
            "/api/addresses/", self.payload(address_line="Second"), format="json"
        )
        self.assertEqual(second.status_code, status.HTTP_201_CREATED, msg=second.data)
        self.assertFalse(second.data["is_default"])

    def test_set_default_demotes_the_previous_one(self):
        first = self.client.post(
            "/api/addresses/", self.payload(address_line="First"), format="json"
        ).data
        second = self.client.post(
            "/api/addresses/", self.payload(address_line="Second"), format="json"
        ).data

        response = self.client.post(f"/api/addresses/{second['id']}/set-default/")
        self.assertEqual(response.status_code, status.HTTP_200_OK, msg=response.data)
        self.assertTrue(response.data["is_default"])

        first_row = Address.objects.get(pk=first["id"])
        self.assertFalse(first_row.is_default)
        self.assertEqual(
            Address.objects.filter(user=self.profile, is_default=True).count(), 1
        )

    def test_list_returns_default_first(self):
        self.client.post("/api/addresses/", self.payload(address_line="First"), format="json")
        second = self.client.post(
            "/api/addresses/", self.payload(address_line="Second"), format="json"
        ).data
        self.client.post(f"/api/addresses/{second['id']}/set-default/")

        response = self.client.get("/api/addresses/")
        self.assertEqual(response.status_code, status.HTTP_200_OK, msg=response.data)
        self.assertEqual(response.data["results"][0]["id"], second["id"])

    def test_filter_to_just_the_default(self):
        self.client.post("/api/addresses/", self.payload(address_line="First"), format="json")
        self.client.post("/api/addresses/", self.payload(address_line="Second"), format="json")

        response = self.client.get("/api/addresses/?is_default=true")
        self.assertEqual(response.data["count"], 1)
        self.assertEqual(response.data["results"][0]["address_line"], "First")

    def test_update_and_delete(self):
        address = self.client.post(
            "/api/addresses/", self.payload(), format="json"
        ).data

        updated = self.client.patch(
            f"/api/addresses/{address['id']}/", {"city": "Oxford"}, format="json"
        )
        self.assertEqual(updated.status_code, status.HTTP_200_OK, msg=updated.data)
        self.assertEqual(updated.data["city"], "Oxford")

        deleted = self.client.delete(f"/api/addresses/{address['id']}/")
        self.assertEqual(deleted.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(Address.objects.count(), 0)

    def test_cannot_touch_another_profiles_address(self):
        mine = self.client.post("/api/addresses/", self.payload(), format="json").data
        intruder = auth_client(self.other)

        self.assertEqual(
            intruder.patch(
                f"/api/addresses/{mine['id']}/", {"city": "Nope"}, format="json"
            ).status_code,
            status.HTTP_404_NOT_FOUND,
        )
        self.assertEqual(
            intruder.delete(f"/api/addresses/{mine['id']}/").status_code,
            status.HTTP_404_NOT_FOUND,
        )
        self.assertEqual(Address.objects.count(), 1)

    def test_unknown_uuid_is_404(self):
        self.assertEqual(
            self.client.get(f"/api/addresses/{uuid.uuid4()}/").status_code,
            status.HTTP_404_NOT_FOUND,
        )

    def test_admin_cannot_use_the_customer_address_book(self):
        """Staff have no address book; the endpoint is customer-only."""
        response = auth_client(create_admin()).get("/api/addresses/")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_factory_helper_matches_the_api(self):
        address = create_address(self.profile, is_default=True)
        self.assertEqual(Address.objects.filter(user=self.profile).count(), 1)
        self.assertTrue(address.is_default)