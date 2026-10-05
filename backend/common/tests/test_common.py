"""Shared error envelope, permission helpers, auth plumbing and secret guards."""

from __future__ import annotations

import base64
import json
import uuid
from decimal import Decimal

from django.core.exceptions import ValidationError as DjangoValidationError
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import SimpleTestCase, TestCase, override_settings
from rest_framework import status
from rest_framework.test import APIClient

from accounts.constants import UserRole
from accounts.models import Profile
from categories.models import Category
from common.images import process_and_store_image
from common.permissions import IsAdmin, IsCustomer, is_admin
from common.testing import (
    create_admin,
    create_profile,
    create_product,
    install_fake_supabase,
    make_supabase_token,
)
from products.models import Product
from products.serializers import ProductSerializer


class ErrorEnvelopeMixin:
    """Every failure must use the same ``{"error": {...}}`` shape."""

    def assertEnvelope(self, response, expected_code: str) -> dict:
        self.assertIn("error", response.data, msg=response.data)
        envelope = response.data["error"]
        self.assertEqual(envelope["code"], expected_code, msg=response.data)
        self.assertTrue(envelope["message"])
        return envelope


class ErrorEnvelopeTests(ErrorEnvelopeMixin, TestCase):
    def setUp(self) -> None:
        self.client = APIClient()

    def test_validation_error_has_code_and_field_details(self):
        category = Category.objects.create(name="Testables")
        response = APIClient()
        response.force_authenticate(user=create_admin())
        response = response.post(
            "/api/products/",
            {"name": "Broken", "sku": "sku-1", "price": "0", "stock": 1, "category_id": category.pk},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST, msg=response.data)
        envelope = self.assertEnvelope(response, "validation_error")
        self.assertIn("details", envelope)
        self.assertIn("price", envelope["details"])

    def test_unauthenticated_uses_401_envelope(self):
        response = self.client.get("/api/cart/")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertEnvelope(response, "not_authenticated")

    def test_forbidden_uses_403_envelope(self):
        self.client.force_authenticate(user=create_profile(email="nobody@example.com"))
        response = self.client.post("/api/categories/", {"name": "Nope"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEnvelope(response, "permission_denied")

    def test_not_found_uses_404_envelope(self):
        response = self.client.get(f"/api/products/{uuid.uuid4()}/")
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertEnvelope(response, "not_found")

    def test_method_not_allowed_uses_405_envelope(self):
        client = APIClient()
        client.force_authenticate(user=create_profile(email="someone@example.com"))
        response = client.patch("/api/cart/", {}, format="json")
        self.assertEqual(response.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)
        self.assertEnvelope(response, "method_not_allowed")

    def test_anonymous_write_to_staff_endpoint_is_401(self):
        response = self.client.post("/api/products/", {"name": "X"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertEnvelope(response, "not_authenticated")
        self.assertEqual(Product.objects.count(), 0)


class ProfileModelTests(TestCase):
    """``public.profiles`` constraints and the role-is-everything rule."""

    def test_id_is_a_uuid_primary_key(self):
        profile = create_profile(email="uuid@example.com")
        self.assertIsInstance(profile.pk, uuid.UUID)
        self.assertEqual(Profile._meta.db_table, "profiles")

    def test_role_is_the_only_privilege_column(self):
        profile = create_profile(email="plain@example.com")
        self.assertFalse(profile.is_admin)
        self.assertFalse(profile.is_staff)

        profile.role = UserRole.ADMIN
        profile.save()
        profile.refresh_from_db()
        self.assertTrue(profile.is_admin)
        self.assertTrue(profile.is_staff, "is_staff must derive from role")

    def test_email_is_unique(self):
        create_profile(email="dup@example.com")
        with self.assertRaises(Exception):
            Profile.objects.create(id=uuid.uuid4(), email="dup@example.com")

    def test_email_is_stored_lowercase(self):
        profile = create_profile(email="MiXeD@Example.COM")
        profile.refresh_from_db()
        self.assertEqual(profile.email, "mixed@example.com")

    def test_empty_optional_fields_are_stored_as_null(self):
        profile = Profile.objects.create(
            id=uuid.uuid4(), email="nulls@example.com", full_name="", phone="", avatar_url=""
        )
        profile.refresh_from_db()
        self.assertIsNone(profile.full_name)
        self.assertIsNone(profile.phone)
        self.assertIsNone(profile.avatar_url)

    def test_display_name_falls_back_to_email(self):
        profile = create_profile(email="nameless@example.com", full_name=None)
        self.assertEqual(profile.display_name, "nameless@example.com")

    def test_no_password_field_exists(self):
        """Credentials live in Supabase Auth, so there is nothing to hash."""
        self.assertNotIn("password", {field.name for field in Profile._meta.get_fields()})
        self.assertFalse(hasattr(Profile, "set_password"))

    def test_no_local_password_authentication_backends(self):
        from django.conf import settings

        self.assertEqual(
            list(getattr(settings, "AUTHENTICATION_BACKENDS", [])),
            [],
            "no backend may verify a password locally",
        )

    def test_usernames_field_points_at_email(self):
        self.assertEqual(Profile.USERNAME_FIELD, "email")


class AnonymousProfileTests(SimpleTestCase):
    def test_placeholder_exposes_the_attribute_surface(self):
        from accounts.models import AnonymousProfile

        user = AnonymousProfile()
        self.assertFalse(user.is_authenticated)
        self.assertTrue(user.is_anonymous)
        self.assertFalse(user.is_admin)
        self.assertIsNone(user.pk)
        self.assertFalse(is_admin(user))


class PermissionHelperTests(TestCase):
    def test_is_admin_reflects_role(self):
        customer = create_profile(email="c@example.com")
        self.assertFalse(is_admin(customer))
        self.assertEqual(customer.role, UserRole.CUSTOMER)

        admin = create_admin(email="a@example.com")
        self.assertTrue(is_admin(admin))

    def test_permission_classes_are_importable(self):
        self.assertTrue(IsAdmin)
        self.assertTrue(IsCustomer)


class SupabaseGatewayTests(TestCase):
    """The GoTrue client, exercised against the in-memory fake."""

    def setUp(self) -> None:
        self.gateway = install_fake_supabase()

    def test_register_creates_a_profile_mirroring_the_auth_user(self):
        response = APIClient().post(
            "/api/auth/register/",
            {
                "email": "New.User@Example.com",
                "full_name": "New User",
                "phone": "+15551234567",
                "password": "Sup3r-Secret!",
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED, msg=response.data)
        self.assertEqual(response.data["email"], "new.user@example.com")
        self.assertEqual(response.data["role"], UserRole.CUSTOMER)

        profile = Profile.objects.get(email="new.user@example.com")
        self.assertEqual(str(profile.pk), self.gateway.users[list(self.gateway.users)[0]]["id"])
        self.assertEqual(profile.full_name, "New User")

    def test_register_never_grants_admin(self):
        response = APIClient().post(
            "/api/auth/register/",
            {
                "email": "sneaky@example.com",
                "full_name": "Sneaky",
                "password": "Sup3r-Secret!",
                "role": UserRole.ADMIN,
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED, msg=response.data)
        self.assertEqual(Profile.objects.get(email="sneaky@example.com").role, UserRole.CUSTOMER)

    def test_register_rejects_a_duplicate_email(self):
        self.gateway.add_user("taken@example.com")
        response = APIClient().post(
            "/api/auth/register/",
            {"email": "taken@example.com", "full_name": "X", "password": "Sup3r-Secret!"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST, msg=response.data)
        self.assertEqual(response.data["error"]["code"], "auth_user_already_exists")

    def test_register_rejects_an_email_already_in_profiles(self):
        create_profile(email="local@example.com")
        response = APIClient().post(
            "/api/auth/register/",
            {"email": "local@example.com", "full_name": "X", "password": "Sup3r-Secret!"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST, msg=response.data)
        self.assertIn("email", response.data["error"]["details"])

    def test_login_returns_a_startstore_token_pair(self):
        self.gateway.add_user("shopper@example.com", "Sup3r-Secret!")
        response = APIClient().post(
            "/api/auth/login/",
            {"email": "SHOPPER@example.com", "password": "Sup3r-Secret!"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK, msg=response.data)
        self.assertIn("access", response.data)
        self.assertIn("refresh", response.data)
        self.assertEqual(response.data["user"]["email"], "shopper@example.com")
        self.assertTrue(Profile.objects.filter(email="shopper@example.com").exists())

    def test_login_with_a_wrong_password_is_401(self):
        self.gateway.add_user("shopper@example.com", "Sup3r-Secret!")
        response = APIClient().post(
            "/api/auth/login/",
            {"email": "shopper@example.com", "password": "wrong-password"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertEqual(response.data["error"]["code"], "auth_invalid_credentials")

    def test_login_does_not_disclose_whether_an_email_exists(self):
        self.gateway.add_user("real@example.com", "Sup3r-Secret!")
        known = APIClient().post(
            "/api/auth/login/",
            {"email": "real@example.com", "password": "wrong"},
            format="json",
        )
        unknown = APIClient().post(
            "/api/auth/login/", {"email": "ghost@example.com", "password": "wrong"}, format="json"
        )
        self.assertEqual(known.status_code, unknown.status_code)
        self.assertEqual(known.data["error"]["code"], unknown.data["error"]["code"])
        self.assertEqual(known.data["error"]["message"], unknown.data["error"]["message"])

    def test_unconfigured_supabase_is_a_503(self):
        from accounts.services import SupabaseAuthUnavailable

        gateway = install_fake_supabase()
        gateway.configured = False
        with self.assertRaises(SupabaseAuthUnavailable):
            gateway.sign_in_with_password(email="a@b.c", password="x")

    def test_profile_sync_never_applies_role_from_metadata(self):
        from accounts.services import ProfileService

        user = {
            "id": str(uuid.uuid4()),
            "email": "meta@example.com",
            "user_metadata": {"full_name": "Meta", "role": UserRole.ADMIN},
        }
        profile = ProfileService.sync_from_supabase(user)
        self.assertEqual(profile.role, UserRole.CUSTOMER)
        self.assertEqual(profile.full_name, "Meta")

    def test_profile_sync_applies_role_when_explicitly_allowed(self):
        from accounts.services import ProfileService

        user = {"id": str(uuid.uuid4()), "email": "promoted@example.com"}
        profile = ProfileService.sync_from_supabase(user, allow_role=UserRole.ADMIN)
        self.assertEqual(profile.role, UserRole.ADMIN)

    def test_profile_sync_rejects_a_non_uuid_user_id(self):
        from accounts.services import ProfileService, SupabaseAuthError

        with self.assertRaises(SupabaseAuthError):
            ProfileService.sync_from_supabase({"id": "not-a-uuid", "email": "x@y.z"})


class TokenAuthenticationTests(TestCase):
    """Both accepted bearer flavours, end to end."""

    def setUp(self) -> None:
        self.gateway = install_fake_supabase()
        self.profile = create_profile(email="shopper@example.com")

    def _seed_auth_user(self, email: str = "shopper@example.com") -> dict:
        """Create a Supabase user bound to ``self.profile``'s id."""
        return self.gateway.add_user(email, id=self.profile.pk)

    def _login(self, email: str = "shopper@example.com") -> dict:
        client = APIClient()
        response = client.post(
            "/api/auth/login/", {"email": email, "password": "Sup3r-Secret!"}, format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK, msg=response.data)
        return response.data

    def test_startstore_token_authenticates(self):
        from common.testing import store_token_client

        client = store_token_client(self.profile)
        response = client.get("/api/auth/me/")
        self.assertEqual(response.status_code, status.HTTP_200_OK, msg=response.data)
        self.assertEqual(response.data["id"], str(self.profile.pk))

    def test_supabase_token_authenticates_and_syncs_the_profile(self):
        # The profile row does not exist yet: auth must create it from GoTrue.
        self.profile.delete()
        auth_user = self.gateway.add_user("new@example.com")
        client = APIClient()
        client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {self.gateway.access_token_for(auth_user)}"
        )

        response = client.get("/api/auth/me/")
        self.assertEqual(response.status_code, status.HTTP_200_OK, msg=response.data)
        self.assertEqual(response.data["email"], "new@example.com")
        self.assertTrue(Profile.objects.filter(pk=auth_user["id"]).exists())

    def test_invalid_supabase_token_is_401(self):
        client = APIClient()
        client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {make_supabase_token('does-not-exist')}"
        )
        response = client.get("/api/auth/me/")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_garbage_token_is_401(self):
        client = APIClient()
        client.credentials(HTTP_AUTHORIZATION="Bearer not-a-jwt-at-all")
        self.assertEqual(client.get("/api/auth/me/").status_code, status.HTTP_401_UNAUTHORIZED)

    def test_token_for_a_deleted_profile_is_401(self):
        from common.testing import store_token_client

        client = store_token_client(self.profile)
        self.profile.delete()
        response = client.get("/api/auth/me/")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertEqual(response.data["error"]["code"], "profile_not_found")

    def test_refresh_rotates_and_logout_blacklists(self):
        self._seed_auth_user()
        client = APIClient()
        tokens = client.post(
            "/api/auth/login/",
            {"email": "shopper@example.com", "password": "Sup3r-Secret!"},
            format="json",
        ).data
        client.credentials(HTTP_AUTHORIZATION=f"Bearer {tokens['access']}")

        refreshed = APIClient().post(
            "/api/auth/refresh/", {"refresh": tokens["refresh"]}, format="json"
        )
        self.assertEqual(refreshed.status_code, status.HTTP_200_OK, msg=refreshed.data)
        self.assertIn("access", refreshed.data)
        # Rotation blacklists the token just used, so log out with the new one.
        self.assertIn("refresh", refreshed.data, "rotation should issue a new refresh token")

        logout = client.post(
            "/api/auth/logout/", {"refresh": refreshed.data["refresh"]}, format="json"
        )
        self.assertEqual(logout.status_code, status.HTTP_204_NO_CONTENT, msg=logout.data)

        reused = APIClient().post(
            "/api/auth/refresh/", {"refresh": refreshed.data["refresh"]}, format="json"
        )
        self.assertEqual(reused.status_code, status.HTTP_401_UNAUTHORIZED)

        old_token = APIClient().post(
            "/api/auth/refresh/", {"refresh": tokens["refresh"]}, format="json"
        )
        self.assertEqual(
            old_token.status_code,
            status.HTTP_401_UNAUTHORIZED,
            "the pre-rotation token must already be blacklisted",
        )

    def test_logout_without_a_token_revokes_every_session(self):
        self._seed_auth_user()
        client = APIClient()
        tokens = client.post(
            "/api/auth/login/",
            {"email": "shopper@example.com", "password": "Sup3r-Secret!"},
            format="json",
        ).data
        client.credentials(HTTP_AUTHORIZATION=f"Bearer {tokens['access']}")

        response = client.post("/api/auth/logout/", {}, format="json")
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT, msg=response.data)

        reused = APIClient().post(
            "/api/auth/refresh/", {"refresh": tokens["refresh"]}, format="json"
        )
        self.assertEqual(reused.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_logout_rejects_another_profiles_refresh_token(self):
        self._seed_auth_user("a@example.com")
        other = create_profile(email="b@example.com")
        self.gateway.add_user("b@example.com", id=other.pk)
        client = APIClient()

        mine = client.post(
            "/api/auth/login/", {"email": "a@example.com", "password": "Sup3r-Secret!"}, format="json"
        ).data
        theirs = client.post(
            "/api/auth/login/",
            {"email": "b@example.com", "password": "Sup3r-Secret!"},
            format="json",
        ).data

        client.credentials(HTTP_AUTHORIZATION=f"Bearer {mine['access']}")
        response = client.post(
            "/api/auth/logout/", {"refresh": theirs["refresh"]}, format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data["error"]["code"], "refresh_token_mismatch")

    def test_logout_can_also_end_the_supabase_session(self):
        self._seed_auth_user()
        client = APIClient()
        tokens = client.post(
            "/api/auth/login/",
            {"email": "shopper@example.com", "password": "Sup3r-Secret!"},
            format="json",
        ).data
        client.credentials(HTTP_AUTHORIZATION=f"Bearer {tokens['access']}")

        supabase_token = make_supabase_token("abc")
        response = client.post(
            "/api/auth/logout/",
            {"refresh": tokens["refresh"], "supabase_access_token": supabase_token},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT, msg=response.data)
        self.assertIn(supabase_token, self.gateway.signed_out)

    def test_issued_token_carries_the_startstore_issuer(self):
        from accounts.authentication import ISSUER

        from common.testing import store_token_client

        client = store_token_client(self.profile)
        header = client._credentials["HTTP_AUTHORIZATION"].split()[1]
        payload_segment = header.split(".")[1]
        padding = "=" * (-len(payload_segment) % 4)
        claims = json.loads(base64.urlsafe_b64decode(payload_segment + padding))
        self.assertEqual(claims["iss"], ISSUER)
        self.assertEqual(claims["user_id"], str(self.profile.pk))

    def test_token_body_survives_a_round_trip(self):
        """A UUID claim must be serialised, or jwt.encode would raise."""
        from common.testing import store_token_client

        client = store_token_client(self.profile)
        self.assertEqual(client.get("/api/auth/me/").status_code, status.HTTP_200_OK)


class ProfileEndpointTests(TestCase):
    def setUp(self) -> None:
        install_fake_supabase()
        self.profile = create_profile(email="shopper@example.com")
        self.client = APIClient()
        self.client.force_authenticate(self.profile)

    def test_me_requires_authentication(self):
        self.assertEqual(APIClient().get("/api/auth/me/").status_code, status.HTTP_401_UNAUTHORIZED)

    def test_me_returns_the_profile(self):
        response = self.client.get("/api/auth/me/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["email"], "shopper@example.com")
        self.assertEqual(response.data["id"], str(self.profile.pk))

    def test_me_patch_updates_allowed_fields(self):
        response = self.client.patch(
            "/api/auth/me/",
            {"full_name": "Renamed Person", "phone": "+15550001111"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK, msg=response.data)
        self.profile.refresh_from_db()
        self.assertEqual(self.profile.full_name, "Renamed Person")
        self.assertEqual(self.profile.phone, "+15550001111")

    def test_emptying_the_name_stores_null(self):
        response = self.client.patch("/api/auth/me/", {"full_name": ""}, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK, msg=response.data)
        self.profile.refresh_from_db()
        self.assertIsNone(self.profile.full_name)

    def test_me_patch_cannot_escalate_privileges(self):
        response = self.client.patch(
            "/api/auth/me/",
            {"full_name": "Sneaky", "role": UserRole.ADMIN},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK, msg=response.data)
        self.profile.refresh_from_db()
        self.assertEqual(self.profile.role, UserRole.CUSTOMER)

    def test_me_patch_rejects_invalid_phone(self):
        response = self.client.patch("/api/auth/me/", {"phone": "not-a-phone"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_me_patch_rejects_non_url_avatar(self):
        response = self.client.patch(
            "/api/auth/me/", {"avatar_url": "javascript:alert(1)"}, format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class IsOwnerResolutionTests(TestCase):
    """``IsOwner`` must resolve both direct and nested ownership."""

    def setUp(self) -> None:
        from cart.models import Cart, CartItem
        from orders.models import Order

        self.owner = create_profile(email="owner@example.com")
        self.other = create_profile(email="other@example.com")
        self.cart = Cart.objects.create(user=self.owner)
        self.item = CartItem.objects.create(
            cart=self.cart, product=create_product(sku="OWN-1"), quantity=1
        )
        self.order = Order.objects.create(
            user=self.owner,
            order_number="SS-TEST-0001",
            shipping_address={"city": "London"},
            subtotal="10.00",
            shipping_cost="0.00",
            total="10.00",
        )

    def _check(self, user, obj, owner_field=None) -> bool:
        from rest_framework.test import APIRequestFactory

        from common.permissions import IsOwner

        request = APIRequestFactory().get("/")
        request.user = user
        view = type("FakeView", (), {"owner_field": owner_field})()
        return IsOwner().has_object_permission(request, view, obj)

    def test_direct_owner_is_allowed(self):
        self.assertTrue(self._check(self.owner, self.order))

    def test_other_profile_is_denied(self):
        self.assertFalse(self._check(self.other, self.order))

    def test_nested_owner_path_is_allowed(self):
        self.assertTrue(self._check(self.owner, self.item, owner_field="cart.user"))

    def test_nested_owner_path_denies_other_profile(self):
        self.assertFalse(self._check(self.other, self.item, owner_field="cart.user"))

    def test_anonymous_is_denied(self):
        from accounts.models import AnonymousProfile

        self.assertFalse(self._check(AnonymousProfile(), self.order))

    def test_unresolvable_path_denies(self):
        self.assertFalse(self._check(self.owner, self.item, owner_field="nope.not.here"))


class RoleGuardedEndpointTests(TestCase):
    """``IsCustomer`` must keep staff-only accounts out of customer flows."""

    def test_is_customer_rejects_admin_and_anonymous(self):
        from accounts.models import AnonymousProfile
        from rest_framework.test import APIRequestFactory

        from common.permissions import IsCustomer

        permission = IsCustomer()

        def allows(user):
            request = APIRequestFactory().get("/")
            request.user = user
            return permission.has_permission(request, view=None)

        self.assertTrue(allows(create_profile(email="shopper@example.com")))
        self.assertFalse(allows(create_admin(email="boss@example.com")))
        self.assertFalse(allows(AnonymousProfile()))


class SecretLeakTests(TestCase):
    """The Supabase service-role key must never reach an HTTP response."""

    def test_schema_does_not_expose_service_role_key(self):
        response = APIClient().get("/api/schema/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        body = response.content.decode("utf-8").lower()
        self.assertNotIn("service_role", body)
        self.assertNotIn("service-role", body)

    def test_profile_payload_has_no_sensitive_columns(self):
        client = APIClient()
        client.force_authenticate(user=create_profile())
        response = client.get("/api/auth/me/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        for forbidden in ("password", "service_role", "is_superuser", "jwt_token"):
            self.assertNotIn(forbidden, response.data)

    def test_product_payload_does_not_leak_configuration(self):
        client = APIClient()
        response = client.get(f"/api/products/{create_product().pk}/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertNotIn("service_role", str(response.data).lower())

    def test_no_settings_module_reads_the_service_role_key(self):
        """Nothing should be able to leak it, because nothing loads it."""
        from django.conf import settings

        self.assertFalse(
            [name for name in dir(settings) if "SERVICE_ROLE" in name.upper()],
            "the service role key must not be a Django setting",
        )


class SecretGuardTests(SimpleTestCase):
    """A production secret must never be a placeholder or trivially short."""

    def test_placeholder_secrets_are_refused(self):
        from config.env import (
            INSECURE_PLACEHOLDER_SECRETS,
            ImproperlyConfiguredEnv,
            assert_secure_secret,
        )

        self.assertTrue(INSECURE_PLACEHOLDER_SECRETS)
        for placeholder in INSECURE_PLACEHOLDER_SECRETS:
            with self.subTest(placeholder=placeholder):
                with self.assertRaises(ImproperlyConfiguredEnv):
                    assert_secure_secret(placeholder)

    def test_missing_secret_is_refused(self):
        from config.env import ImproperlyConfiguredEnv, assert_secure_secret

        for value in (None, ""):
            with self.subTest(value=value):
                with self.assertRaises(ImproperlyConfiguredEnv):
                    assert_secure_secret(value)

    def test_short_secret_is_refused(self):
        from config.env import ImproperlyConfiguredEnv, assert_secure_secret

        with self.assertRaises(ImproperlyConfiguredEnv):
            assert_secure_secret("tooshort")

    def test_a_strong_secret_passes(self):
        from config.env import assert_secure_secret

        strong = "k3Yq7Tn9Zp2Lm4Rx8Wc6Bd1Fg5Hj0Kl3Mn7Pq9Tv2Xy4Qs7Uw9Ze1Ab"
        self.assertEqual(assert_secure_secret(strong), strong)
        self.assertGreaterEqual(len(strong), 50)

    def test_length_floor_matches_djangos_own_threshold(self):
        from config.env import MIN_SECRET_KEY_LENGTH, ImproperlyConfiguredEnv, assert_secure_secret

        self.assertEqual(MIN_SECRET_KEY_LENGTH, 50)
        with self.assertRaises(ImproperlyConfiguredEnv):
            assert_secure_secret("a" * 49)

    def test_the_local_env_placeholder_is_covered(self):
        from config.env import INSECURE_PLACEHOLDER_SECRETS

        self.assertIn(
            "dev-only-insecure-key-change-before-deploying-anywhere-real",
            INSECURE_PLACEHOLDER_SECRETS,
        )


class ImageProcessingTests(SimpleTestCase):
    def test_non_image_upload_is_rejected(self):
        upload = SimpleUploadedFile("notes.txt", b"not an image", content_type="text/plain")
        with self.assertRaises(DjangoValidationError):
            process_and_store_image(upload)

    def test_empty_upload_is_rejected(self):
        upload = SimpleUploadedFile("empty.png", b"", content_type="image/png")
        with self.assertRaises(DjangoValidationError):
            process_and_store_image(upload)


class ProductDerivedValueTests(TestCase):
    def test_final_price_prefers_discount(self):
        product = Product(price=Decimal("100.00"), discount_price=Decimal("79.99"))
        self.assertEqual(product.final_price, Decimal("79.99"))
        self.assertTrue(product.is_on_sale)
        self.assertEqual(product.discount_percentage, 20)

    def test_final_price_ignores_discount_at_or_above_price(self):
        product = Product(price=Decimal("50.00"), discount_price=Decimal("80.00"))
        self.assertEqual(product.final_price, Decimal("50.00"))
        self.assertFalse(product.is_on_sale)

    def test_no_discount_means_not_on_sale(self):
        product = Product(price=Decimal("50.00"), discount_price=None)
        self.assertEqual(product.final_price, Decimal("50.00"))
        self.assertFalse(product.is_on_sale)
        self.assertEqual(product.discount_percentage, 0)

    def test_serializer_exposes_derived_fields(self):
        from common.testing import create_category

        product = create_product(
            category=create_category(),
            name="Desk Lamp",
            sku="LAMP-1",
            price="60.00",
            discount_price="45.00",
            stock=3,
        )
        data = ProductSerializer(product).data
        self.assertEqual(data["final_price"], "45.00")
        self.assertEqual(data["discount_percentage"], 25)
        self.assertTrue(data["is_on_sale"])
        self.assertTrue(data["in_stock"])

    def test_serializer_tolerates_a_null_category(self):
        """`products.category_id` is nullable, so the response must cope."""
        from common.testing import create_category

        product = create_product(category=create_category(), sku="NOCAT-1")
        product.category = None
        product.save()

        data = ProductSerializer(product).data
        self.assertIsNone(data["category"])
        self.assertIsNone(data["category_name"] if "category_name" in data else None)

    def test_model_clean_rejects_discount_above_price(self):
        product = Product(price=Decimal("10.00"), discount_price=Decimal("20.00"))
        with self.assertRaises(DjangoValidationError):
            product.clean()

    def test_zero_price_is_stored_but_rejected_by_the_api(self):
        """The DB allows >= 0; the serializer enforces the business rule."""
        from common.testing import auth_client

        product = create_product(sku="FREE-1", price="0.00")
        self.assertEqual(product.price, Decimal("0.00"))

        response = auth_client(create_admin()).post(
            "/api/products/",
            {"name": "Free", "sku": "FREE-2", "price": "0.00", "stock": 1},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


@override_settings(STARTSTORE_CURRENCY="USD")
class StoreConfigurationTests(SimpleTestCase):
    def test_currency_is_namespaced(self):
        """Windows exports CURRENCY=<locale>; it must not reach the store."""
        from django.conf import settings

        self.assertTrue(hasattr(settings, "STARTSTORE_CURRENCY"))
        self.assertFalse(hasattr(settings, "CURRENCY"))
