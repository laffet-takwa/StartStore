"""Shared test helpers: object factories, clients and payload builders.

Keeping these in one module avoids every test module redefining the same five
lines, and guarantees the fixtures used across apps stay consistent.

Identities here are :class:`accounts.models.Profile` rows with a UUID pk,
matching ``public.profiles``. Passwords live in Supabase, so the fake gateway in
this module stands in for GoTrue and no password is ever hashed.
"""

from __future__ import annotations

import uuid
from decimal import Decimal

from rest_framework.test import APIClient

from accounts.constants import UserRole
from accounts.models import Address, Profile
from categories.models import Category
from products.models import Product


# --------------------------------------------------------------------------- #
# Profiles
# --------------------------------------------------------------------------- #
def create_profile(
    email: str = "shopper@example.com",
    *,
    role: str = UserRole.CUSTOMER,
    full_name: str = "Test Shopper",
    phone: str | None = None,
    pk: uuid.UUID | None = None,
    **extra,
) -> Profile:
    """Create a profile row exactly as Supabase sync would."""
    return Profile.objects.create(
        id=pk or uuid.uuid4(),
        email=email,
        full_name=full_name,
        phone=phone,
        role=role,
        **extra,
    )


def create_admin(
    email: str = "admin@example.com", *, full_name: str = "Test Admin", **extra
) -> Profile:
    return create_profile(email=email, role=UserRole.ADMIN, full_name=full_name, **extra)


# --------------------------------------------------------------------------- #
# Catalogue
# --------------------------------------------------------------------------- #
def create_category(name: str = "Electronics", **kwargs) -> Category:
    return Category.objects.create(name=name, **kwargs)


def create_product(
    *,
    category: Category | None = None,
    name: str = "Mechanical Keyboard",
    sku: str | None = "SKU-1000",
    price: str = "120.00",
    stock: int = 25,
    discount_price: str | None = None,
    **kwargs,
) -> Product:
    return Product.objects.create(
        category=category if category is not None else create_category(),
        name=name,
        sku=sku,
        price=Decimal(price),
        stock=stock,
        discount_price=Decimal(discount_price) if discount_price else None,
        **kwargs,
    )


def create_address(
    user: Profile,
    *,
    address_line: str = "1 Analytical Engine Way",
    city: str = "London",
    postal_code: str = "EC1A 1BB",
    country: str = "GB",
    full_name: str | None = "Ada Lovelace",
    phone: str | None = "+15551234567",
    is_default: bool = False,
) -> Address:
    return Address.objects.create(
        user=user,
        full_name=full_name,
        phone=phone,
        address_line=address_line,
        city=city,
        postal_code=postal_code,
        country=country,
        is_default=is_default,
    )


# --------------------------------------------------------------------------- #
# Clients
# --------------------------------------------------------------------------- #
def api_client() -> APIClient:
    return APIClient()


def auth_client(profile: Profile) -> APIClient:
    """Client authenticated as ``profile`` without going through Supabase."""
    client = APIClient()
    client.force_authenticate(user=profile)
    return client


def store_token_client(profile: Profile, *, issuer: str = "startstore") -> APIClient:
    """Client holding a real StartStore JWT, exercising the auth stack."""
    from accounts.authentication import issue_token_pair

    pair = issue_token_pair(profile)
    client = APIClient()
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {pair['access']}")
    return client


# --------------------------------------------------------------------------- #
# Fake Supabase Auth gateway
# --------------------------------------------------------------------------- #
def make_supabase_token(user_id: str, *, kind: str = "access") -> str:
    """Build an unsigned but structurally valid JWT for a Supabase user.

    The real authenticator peeks at the payload to tell token flavours apart and
    rejects anything it cannot verify with StartStore's signing key, so the fake
    token has to look like a three segment JWT rather than an opaque string.
    """
    import base64
    import json

    def segment(payload: dict) -> str:
        raw = base64.urlsafe_b64encode(json.dumps(payload).encode()).decode().rstrip("=")
        return raw

    header = segment({"alg": "HS256", "typ": "JWT"})
    payload = segment(
        {
            "iss": "supabase",
            "ref": "fake-project-ref",
            "role": "authenticated",
            "sub": str(user_id),
            "aud": "authenticated",
        }
    )
    return f"{header}.{payload}.c2lnbmF0dXJl"


class FakeSupabaseAuthGateway:
    """In-memory stand-in for GoTrue.

    Exercises the real :class:`accounts.authentication.SupabaseJWTAuthentication`
    path without any network access.
    """

    def __init__(self) -> None:
        self.users: dict[str, dict] = {}
        self.passwords: dict[str, str] = {}
        self.signed_out: list[str] = []
        self.configured = True

    # --- seeding ------------------------------------------------------------ #
    def add_user(self, email: str, password: str = "Sup3r-Secret!", **extra) -> dict:
        email = email.strip().lower()
        user = {
            "id": str(extra.pop("id", uuid.uuid4())),
            "email": email,
            "user_metadata": extra.pop("user_metadata", {}),
            "banned": extra.pop("banned", False),
        }
        user.update(extra)
        self.users[user["id"]] = user
        self.passwords[email] = password
        return user

    def access_token_for(self, user: dict) -> str:
        return make_supabase_token(user["id"])

    # --- gateway surface ---------------------------------------------------- #
    def _require_configured(self) -> None:
        from accounts.services import SupabaseAuthUnavailable

        if not self.configured:
            raise SupabaseAuthUnavailable()

    def sign_up(self, *, email: str, password: str, metadata: dict | None = None):
        from accounts.services import SupabaseAuthError, SupabaseSession

        self._require_configured()
        email = email.strip().lower()
        if email in self.passwords:
            raise SupabaseAuthError(
                "User already registered", code="user_already_exists", status=422
            )
        user = self.add_user(email, password, user_metadata=dict(metadata or {}))
        return SupabaseSession(
            user_id=user["id"],
            email=email,
            access_token=self.access_token_for(user),
            refresh_token=f"supabase-refresh-{user['id']}",
            raw=user,
        )

    def sign_in_with_password(self, *, email: str, password: str):
        from accounts.services import SupabaseAuthError, SupabaseSession

        self._require_configured()
        email = email.strip().lower()
        if self.passwords.get(email) != password:
            raise SupabaseAuthError(
                "Invalid login credentials", code="invalid_credentials", status=400
            )
        user = next(u for u in self.users.values() if u["email"] == email)
        return SupabaseSession(
            user_id=user["id"],
            email=email,
            access_token=self.access_token_for(user),
            refresh_token=f"supabase-refresh-{user['id']}",
            raw=user,
        )

    def get_user(self, access_token: str):
        import base64
        import json

        if not access_token:
            return None
        parts = access_token.split(".")
        if len(parts) != 3:
            return None
        try:
            segment = parts[1] + "=" * (-len(parts[1]) % 4)
            claims = json.loads(base64.urlsafe_b64decode(segment))
            sub = claims.get("sub")
        except (ValueError, json.JSONDecodeError):
            return None
        return self.users.get(str(sub)) if sub else None

    def sign_out(self, access_token: str) -> None:
        self.signed_out.append(access_token)

    def update_user_metadata(self, profile) -> dict | None:
        user = self.users.get(str(profile.pk))
        if user is None:
            return None
        user["user_metadata"] = {
            "full_name": profile.full_name,
            "phone": profile.phone,
            "avatar_url": profile.avatar_url,
        }
        return user


def install_fake_supabase(gateway: FakeSupabaseAuthGateway | None = None):
    """Patch the Supabase gateway seam and return it.

    ``accounts.views`` and ``accounts.authentication`` both resolve the gateway
    through ``accounts.services``, so patching that one attribute covers every
    call site.
    """
    from unittest import mock

    from accounts import services as accounts_services

    gateway = gateway or FakeSupabaseAuthGateway()
    accounts_services.reset_supabase_auth_gateway()
    mock.patch.object(
        accounts_services, "get_supabase_auth_gateway", lambda: gateway
    ).start()
    return gateway


# --------------------------------------------------------------------------- #
# Payload builders
# --------------------------------------------------------------------------- #
def checkout_payload(**address_overrides) -> dict:
    """Inline shipping address matching the ``public.addresses`` column set."""
    address = {
        "full_name": "Ada Lovelace",
        "phone": "+15551234567",
        "address_line": "1 Analytical Engine Way",
        "city": "London",
        "postal_code": "EC1A 1BB",
        "country": "GB",
    }
    address.update(address_overrides)
    return {"shipping_address": address}
