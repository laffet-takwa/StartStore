"""Integration tests for the Supabase-issued token path.

Supabase Auth is the source of truth: the browser signs in there and Django
validates the resulting JWT. These tests exercise the middleware-level
behaviour (header parsing, rejection, profile creation) plus the profile
synchronisation contract that ``profiles.id == auth.users.id``.
"""

from __future__ import annotations

import base64
import json
import uuid

from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient

from accounts.constants import UserRole
from accounts.models import Profile
from common.testing import create_admin, create_profile, install_fake_supabase
from products.serializers import ProductSerializer


def make_jwt(payload: dict) -> str:
    """Build an unsigned but structurally valid JWT for payload inspection."""

    def segment(data: dict) -> str:
        raw = base64.urlsafe_b64encode(json.dumps(data).encode()).decode().rstrip("=")
        return raw

    header = segment({"alg": "HS256", "typ": "JWT"})
    return f"{header}.{segment(payload)}.c2lnbmF0dXJl"


class SupabaseTokenAuthenticationTests(TestCase):
    """A valid Supabase access token must authenticate and materialise a profile."""

    def setUp(self) -> None:
        self.gateway = install_fake_supabase()
        self.client = APIClient()
        self.category = None

    def _token_for(self, user: dict) -> str:
        return self.gateway.access_token_for(user)

    def test_valid_supabase_token_authenticates_and_creates_the_profile(self):
        auth_user = self.gateway.add_user("new@example.com")

        client = APIClient()
        client.credentials(HTTP_AUTHORIZATION=f"Bearer {self._token_for(auth_user)}")
        response = client.get("/api/auth/me/")

        self.assertEqual(response.status_code, status.HTTP_200_OK, msg=response.data)
        self.assertEqual(response.data["id"], auth_user["id"])
        self.assertEqual(response.data["email"], "new@example.com")

        profile = Profile.objects.get(pk=auth_user["id"])
        self.assertEqual(profile.id, uuid.UUID(auth_user["id"]))
        self.assertEqual(profile.role, UserRole.CUSTOMER)

    def test_profile_is_created_exactly_once(self):
        auth_user = self.gateway.add_user("repeat@example.com")
        token = self._token_for(auth_user)

        for _ in range(3):
            client = APIClient()
            client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
            self.assertEqual(client.get("/api/auth/me/").status_code, status.HTTP_200_OK)

        self.assertEqual(Profile.objects.filter(pk=auth_user["id"]).count(), 1)

    def test_invalid_supabase_token_is_rejected_with_401(self):
        response = self.client.get(
            "/api/auth/me/", HTTP_AUTHORIZATION="Bearer not-a-real-token"
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_token_signed_for_an_unknown_user_is_rejected(self):
        """A well-formed token whose subject no longer exists must not pass."""
        ghost_id = str(uuid.uuid4())
        token = make_jwt({"iss": "supabase", "sub": ghost_id, "role": "authenticated"})

        response = self.client.get("/api/auth/me/", HTTP_AUTHORIZATION=f"Bearer {token}")
        # The gateway is asked about the subject and does not recognise it.
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_expired_token_is_rejected(self):
        auth_user = self.gateway.add_user("expired@example.com")
        token = make_jwt(
            {
                "iss": "supabase",
                "sub": auth_user["id"],
                "role": "authenticated",
                "exp": 1, # long expired
            }
        )
        response = self.client.get("/api/auth/me/", HTTP_AUTHORIZATION=f"Bearer {token}")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_malformed_authorization_header_is_rejected(self):
        for header in ("Bearer", "Bearer a b c", "Basic abc123"):
            with self.subTest(header=header):
                response = self.client.get("/api/auth/me/", HTTP_AUTHORIZATION=header)
                self.assertIn(
                    response.status_code,
                    (status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN),
                )

    def test_no_header_means_anonymous_not_an_error(self):
        response = self.client.get("/api/cart/")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_authenticated_user_is_always_taken_from_the_token(self):
        """A body-supplied user_id cannot change who is authenticated."""
        from common.testing import create_product

        product = create_product(sku="TOKEN-1")
        victim = create_profile(email="victim@example.com")
        attacker = self.gateway.add_user("attacker@example.com")

        client = APIClient()
        client.credentials(HTTP_AUTHORIZATION=f"Bearer {self._token_for(attacker)}")
        response = client.post(
            "/api/cart/items/",
            {"product_id": str(product.pk), "quantity": 1, "user_id": str(victim.pk)},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED, msg=response.data)

        # The line landed in the attacker's cart, not the victim's.
        from cart.models import Cart

        self.assertTrue(Cart.objects.filter(user__email="attacker@example.com").exists())
        self.assertFalse(Cart.objects.filter(user=victim).exists())


class ProfileSyncTests(TestCase):
    """``profiles`` mirrors ``auth.users``; ``role`` is never client-controlled."""

    def setUp(self) -> None:
        self.gateway = install_fake_supabase()

    def test_new_users_default_to_customer(self):
        from accounts.services import ProfileService

        profile = ProfileService.sync_from_supabase(
            {"id": str(uuid.uuid4()), "email": "fresh@example.com"}
        )
        self.assertEqual(profile.role, UserRole.CUSTOMER)

    def test_user_metadata_supplies_the_profile_fields(self):
        from accounts.services import ProfileService

        profile = ProfileService.sync_from_supabase(
            {
                "id": str(uuid.uuid4()),
                "email": "meta@example.com",
                "user_metadata": {"full_name": "Grace Hopper", "phone": "+15551230000"},
            }
        )
        self.assertEqual(profile.full_name, "Grace Hopper")
        self.assertEqual(profile.phone, "+15551230000")

    def test_role_in_user_metadata_is_ignored(self):
        from accounts.services import ProfileService

        profile = ProfileService.sync_from_supabase(
            {
                "id": str(uuid.uuid4()),
                "email": "sneaky@example.com",
                "user_metadata": {"role": "admin"},
            }
        )
        self.assertEqual(profile.role, UserRole.CUSTOMER, "role must not come from metadata")

    def test_an_existing_role_survives_re_sync(self):
        from accounts.services import ProfileService

        auth_user = self.gateway.add_user("boss@example.com")
        profile = ProfileService.sync_from_supabase(
            {"id": auth_user["id"], "email": "boss@example.com"},
            allow_role=UserRole.ADMIN,
        )
        self.assertEqual(profile.role, UserRole.ADMIN)

        resynced = ProfileService.sync_from_supabase(
            {"id": auth_user["id"], "email": "boss@example.com"}
        )
        self.assertEqual(
            resynced.role, UserRole.ADMIN, "re-syncing must not silently demote an admin"
        )

    def test_registration_never_grants_admin(self):
        client = APIClient()
        response = client.post(
            "/api/auth/register/",
            {
                "email": "climber@example.com",
                "full_name": "Climber",
                "password": "Sup3r-Secret!",
                "role": "admin",
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED, msg=response.data)
        self.assertEqual(response.data["role"], UserRole.CUSTOMER)


class SupabaseRoleEnforcementTests(TestCase):
    """Django, not the frontend, decides who is staff."""

    def setUp(self) -> None:
        from accounts.services import ProfileService

        self.gateway = install_fake_supabase()
        self.customer = self.gateway.add_user("customer@example.com")
        self.admin = self.gateway.add_user("admin@example.com")
        # Materialise both profiles, as a first authenticated request would.
        self.customer_profile = ProfileService.sync_from_supabase(
            {"id": self.customer["id"], "email": self.customer["email"]}
        )
        self.admin_profile = ProfileService.sync_from_supabase(
            {"id": self.admin["id"], "email": self.admin["email"]}
        )

    def _client(self, auth_user: dict) -> APIClient:
        client = APIClient()
        client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {self.gateway.access_token_for(auth_user)}"
        )
        return client

    def test_a_supabase_customer_cannot_reach_admin_endpoints(self):
        for path in (
            "/api/admin/dashboard/",
            "/api/admin/products/",
            "/api/admin/orders/",
            "/api/admin/users/",
        ):
            with self.subTest(path=path):
                response = self._client(self.customer).get(path)
                self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
                self.assertEqual(response.data["error"]["code"], "permission_denied")

    def test_promoting_via_the_api_grants_admin_access(self):
        customer_profile = Profile.objects.get(pk=self.customer["id"])
        response = self._client(self.customer).post(
            f"/api/admin/users/{customer_profile.pk}/role/", {"role": "admin"}, format="json"
        )
        # A customer cannot promote anybody, including themselves.
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_an_admin_profile_reaches_admin_endpoints(self):
        admin_profile = Profile.objects.get(pk=self.admin["id"])
        admin_profile.role = UserRole.ADMIN
        admin_profile.save(update_fields=["role", "updated_at"])

        response = self._client(self.admin).get("/api/admin/dashboard/")
        self.assertEqual(response.status_code, status.HTTP_200_OK, msg=response.data)


    def test_a_supabase_customer_cannot_reach_admin_endpoints(self):
        for path in (
            "/api/admin/dashboard/",
            "/api/admin/products/",
            "/api/admin/orders/",
            "/api/admin/users/",
        ):
            with self.subTest(path=path):
                response = self._client(self.customer).get(path)
                self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
                self.assertEqual(response.data["error"]["code"], "permission_denied")

    def test_promoting_via_the_api_grants_admin_access(self):
        response = self._client(self.customer).post(
            f"/api/admin/users/{self.customer_profile.pk}/role/",
            {"role": "admin"},
            format="json",
        )
        # A customer cannot promote anybody, including themselves.
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.customer_profile.refresh_from_db()
        self.assertEqual(self.customer_profile.role, UserRole.CUSTOMER)

    def test_an_admin_profile_reaches_admin_endpoints(self):
        self.admin_profile.role = UserRole.ADMIN
        self.admin_profile.save(update_fields=["role", "updated_at"])

        response = self._client(self.admin).get("/api/admin/dashboard/")
        self.assertEqual(response.status_code, status.HTTP_200_OK, msg=response.data)


class CrossUserIsolationTests(TestCase):
    """A Supabase token cannot reach another profile's data."""

    def setUp(self) -> None:
        from accounts.services import ProfileService

        self.gateway = install_fake_supabase()
        self.victim = self.gateway.add_user("victim@example.com")
        self.attacker = self.gateway.add_user("attacker@example.com")
        self.victim_profile = ProfileService.sync_from_supabase(
            {"id": self.victim["id"], "email": self.victim["email"]}
        )
        ProfileService.sync_from_supabase(
            {"id": self.attacker["id"], "email": self.attacker["email"]}
        )

    def test_addresses_are_scoped_to_the_token_owner(self):
        from accounts.models import Address

        address = Address.objects.create(
            user=self.victim_profile,
            address_line="1 Victim Road",
            city="Leeds",
            postal_code="LS1",
            country="GB",
        )

        client = APIClient()
        client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {self.gateway.access_token_for(self.attacker)}"
        )
        self.assertEqual(
            client.get(f"/api/addresses/{address.pk}/").status_code, status.HTTP_404_NOT_FOUND
        )
        self.assertEqual(
            client.delete(f"/api/addresses/{address.pk}/").status_code, status.HTTP_404_NOT_FOUND
        )
        self.assertEqual(Address.objects.count(), 1, "the address must still exist")


class SerializerContractTests(TestCase):
    """Guards the field names the frontend types depend on."""

    def test_product_summary_shape_matches_the_frontend_type(self):
        from products.serializers import ProductSummarySerializer

        from common.testing import create_category, create_product

        product = create_product(category=create_category(), sku="SHAPE-1")
        data = ProductSummarySerializer(product).data
        for field in (
            "id",
            "name",
            "slug",
            "sku",
            "category",
            "category_name",
            "price",
            "final_price",
            "stock",
            "in_stock",
            "image_url",
            "is_active",
        ):
            self.assertIn(field, data, msg=f"ProductSummary is missing {field}")

    def test_full_product_shape_matches_the_frontend_type(self):
        from common.testing import create_category, create_product
        from products.serializers import ProductSerializer

        product = create_product(category=create_category(), sku="SHAPE-2")
        data = ProductSerializer(product).data
        for field in ("is_on_sale", "discount_percentage", "images", "description"):
            self.assertIn(field, data, msg=f"Product is missing {field}")

    def test_profile_never_exposes_a_password(self):
        profile = create_profile(email="shape@example.com")
        self.assertNotIn("password", {field.name for field in Profile._meta.get_fields()})
        self.assertEqual(create_admin(email="shape-admin@example.com").role, UserRole.ADMIN)
        self.assertTrue(profile.pk)
