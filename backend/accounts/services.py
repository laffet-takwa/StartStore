"""Supabase Auth gateway.

Supabase owns credentials, so every login, registration and token validation
goes through its GoTrue REST API using the *publishable* (client-safe) key. The
service-role key is never used here.

Only the standard library is used for HTTP so there is no extra dependency and
no hidden middleware. All network access funnels through :meth:`SupabaseAuthGateway.request`,
which is the single seam tests replace.
"""

from __future__ import annotations

import json
import logging
import urllib.error
import urllib.request
from dataclasses import dataclass
from typing import TYPE_CHECKING, Any

from django.conf import settings
from django.db import transaction

from accounts.constants import UserRole
from accounts.models import Profile

if TYPE_CHECKING:  # pragma: no cover
    from accounts.models import Address

logger = logging.getLogger("startstore.auth")

#: Claim Supabase adds to its access tokens; used to tell token flavours apart.
SUPABASE_ISSUER_PREFIX = "supabase"


class SupabaseAuthError(Exception):
    """A GoTrue call failed. ``code`` mirrors GoTrue's error code."""

    def __init__(self, message: str, *, code: str = "auth_error", status: int | None = None):
        super().__init__(message)
        self.message = message
        self.code = code
        self.status = status


class SupabaseAuthUnavailable(SupabaseAuthError):
    """Supabase credentials are not configured on this deployment."""

    def __init__(self, message: str = "Supabase authentication is not configured."):
        super().__init__(message, code="auth_provider_unavailable")


@dataclass(frozen=True, slots=True)
class SupabaseSession:
    """A successful GoTrue authentication response."""

    user_id: str
    email: str
    access_token: str
    refresh_token: str
    email_confirmed: bool = True
    raw: dict | None = None


class SupabaseAuthGateway:
    """Thin, dependency-free client for the GoTrue endpoints."""

    def __init__(
        self,
        *,
        url: str | None = None,
        api_key: str | None = None,
        timeout: float = 10.0,
    ) -> None:
        self.base_url = (url or "").rstrip("/")
        self.api_key = api_key or ""
        self.timeout = timeout

    @property
    def configured(self) -> bool:
        return bool(self.base_url and self.api_key)

    # --- HTTP --------------------------------------------------------------- #
    def request(
        self,
        method: str,
        path: str,
        *,
        body: dict | None = None,
        access_token: str = "",
    ) -> tuple[int, Any]:
        """Perform one GoTrue call. Returns ``(status_code, decoded_body)``."""
        if not self.configured:
            raise SupabaseAuthUnavailable()

        url = f"{self.base_url}/auth/v1/{path.lstrip('/')}"
        headers = {
            "apikey": self.api_key,
            "Content-Type": "application/json",
            "Accept": "application/json",
        }
        if access_token:
            headers["Authorization"] = f"Bearer {access_token}"

        data = json.dumps(body).encode("utf-8") if body is not None else None
        request = urllib.request.Request(url, data=data, headers=headers, method=method)

        try:
            with urllib.request.urlopen(request, timeout=self.timeout) as response:
                raw = response.read().decode("utf-8") or "{}"
                return response.status, json.loads(raw)
        except urllib.error.HTTPError as exc:
            raw = exc.read().decode("utf-8") or "{}"
            try:
                payload = json.loads(raw)
            except json.JSONDecodeError:
                payload = {"message": raw[:200]}
            raise _to_auth_error(exc.code, payload) from None
        except (urllib.error.URLError, TimeoutError, OSError) as exc:
            logger.warning("Supabase Auth request failed: %s", exc)
            raise SupabaseAuthError(
                "Could not reach the authentication service.", code="auth_network_error"
            ) from None

    # --- GoTrue operations --------------------------------------------------- #
    def sign_up(self, *, email: str, password: str, metadata: dict | None = None) -> SupabaseSession:
        status, payload = self.request(
            "POST",
            "signup",
            body={"email": email, "password": password, "data": metadata or {}},
        )
        if status not in (200, 201):
            raise SupabaseAuthError("Sign-up was rejected.", code="signup_failed", status=status)
        return _session_from_payload(payload)

    def sign_in_with_password(self, *, email: str, password: str) -> SupabaseSession:
        status, payload = self.request(
            "POST", "token?grant_type=password", body={"email": email, "password": password}
        )
        if status != 200:
            raise SupabaseAuthError(
                "Incorrect email or password.", code="invalid_credentials", status=status
            )
        return _session_from_payload(payload)

    def get_user(self, access_token: str) -> dict | None:
        """Return the GoTrue user for a token, or ``None`` when it is invalid."""
        if not access_token:
            return None
        try:
            _, payload = self.request("GET", "user", access_token=access_token)
        except SupabaseAuthError:
            return None
        return payload if isinstance(payload, dict) else None

    def update_user_metadata(self, profile: "Profile") -> dict | None:
        """Write the editable profile fields back into GoTrue user metadata.

        Uses the service-role-free path: the caller supplies a Supabase access
        token when one is available. Without one there is nothing to authorise
        the call, so this is a no-op and the profile row stays authoritative.
        """
        access_token = getattr(profile, "supabase_access_token", "")
        if not access_token:
            return None
        metadata = {
            key: value
            for key, value in (
                ("full_name", profile.full_name),
                ("phone", profile.phone),
                ("avatar_url", profile.avatar_url),
            )
            if value
        }
        _, payload = self.request(
            "PUT", "user", body={"data": metadata}, access_token=access_token
        )
        return payload if isinstance(payload, dict) else None

    def sign_out(self, access_token: str) -> None:
        """Best-effort session revocation in GoTrue."""
        if not access_token:
            return
        try:
            self.request("POST", "logout", access_token=access_token)
        except SupabaseAuthError:
            # Our own refresh token is blacklisted regardless, so a failure here
            # must not turn a successful logout into an error.
            logger.info("Supabase sign-out call failed; continuing with local revocation")


def _to_auth_error(status: int, payload: dict) -> SupabaseAuthError:
    message = str(payload.get("msg") or payload.get("message") or payload.get("error_description") or "")
    code = str(payload.get("error_code") or payload.get("code") or "auth_error")
    if not message:
        message = "Incorrect email or password." if status in (400, 401) else "Authentication failed."
    return SupabaseAuthError(message, code=code, status=status)


def _session_from_payload(payload: dict) -> SupabaseSession:
    user = payload.get("user") or {}
    user_id = user.get("id") or payload.get("id")
    if not user_id:
        raise SupabaseAuthError(
            "The authentication service returned an unexpected response.",
            code="auth_bad_response",
        )
    return SupabaseSession(
        user_id=str(user_id),
        email=str(user.get("email") or "").strip().lower(),
        access_token=str(payload.get("access_token") or ""),
        refresh_token=str(payload.get("refresh_token") or ""),
        email_confirmed=bool(user.get("email_confirmed_at") or user.get("confirmed_at") or True),
        raw=payload,
    )


_gateway: SupabaseAuthGateway | None = None


def get_supabase_auth_gateway() -> SupabaseAuthGateway:
    """Process-wide gateway built from settings."""
    global _gateway
    if _gateway is None:
        _gateway = SupabaseAuthGateway(
            url=getattr(settings, "SUPABASE_URL", ""),
            api_key=getattr(settings, "SUPABASE_ANON_KEY", ""),
            timeout=float(getattr(settings, "SUPABASE_AUTH_TIMEOUT", 10)),
        )
    return _gateway


def reset_supabase_auth_gateway() -> None:
    """Drop the cached gateway (used by tests and after a settings override)."""
    global _gateway
    _gateway = None


class ProfileService:
    """Keeps ``public.profiles`` in step with ``auth.users``."""

    @staticmethod
    def sync_from_supabase(
        user: dict,
        *,
        defaults: dict | None = None,
        allow_role: str | None = None,
    ) -> Profile:
        """Create or refresh the profile row backing a Supabase user.

        ``role`` is only ever applied when explicitly supplied, so a client can
        never promote itself by choosing values in the sign-up metadata.
        """
        from uuid import UUID

        raw_id = str(user.get("id") or "").strip()
        if not raw_id:
            raise SupabaseAuthError("The authentication response contained no user id.")
        try:
            profile_id = UUID(raw_id)
        except ValueError:
            raise SupabaseAuthError(
                "The authentication service returned an invalid user id.",
                code="auth_bad_response",
            ) from None

        email = str(user.get("email") or "").strip().lower()
        metadata = user.get("user_metadata") or {}

        fields: dict[str, Any] = {}
        full_name = defaults.get("full_name") if defaults else None
        full_name = full_name or metadata.get("full_name") or metadata.get("name")
        phone = defaults.get("phone") if defaults else None
        phone = phone or metadata.get("phone")
        avatar = defaults.get("avatar_url") if defaults else None
        avatar = avatar or metadata.get("avatar_url")

        if full_name:
            fields["full_name"] = str(full_name).strip()[:150]
        if phone:
            fields["phone"] = str(phone).strip()[:32]
        if avatar:
            fields["avatar_url"] = str(avatar)[:1000]
        if allow_role in dict(UserRole.choices):
            fields["role"] = allow_role

        banned = bool(user.get("banned") or user.get("deleted_at"))

        if email:
            # A profile row for this address already exists under a different
            # auth id. Surfacing that as a conflict beats letting the UNIQUE
            # constraint blow up as a 500 during login.
            clash = (
                Profile.objects.filter(email__iexact=email)
                .exclude(pk=profile_id)
                .first()
            )
            if clash is not None:
                raise SupabaseAuthError(
                    "This email is already linked to a different account.",
                    code="profile_email_conflict",
                    status=409,
                )

        profile, created = Profile.objects.update_or_create(
            id=profile_id,
            defaults={"email": email, **fields} if email else fields,
        )
        if banned:
            profile._banned = True
        profile.sync_source = "supabase"
        profile.sync_created = created
        return profile


class AddressService:
    """Address rules: at most one default address per profile."""

    @staticmethod
    @transaction.atomic
    def create(*, user: Profile, is_default: bool = False, **fields) -> "Address":
        """Create an address, demoting the previous default when needed.

        The first address a profile saves always becomes the default, so there is
        always something to prefill at checkout.
        """
        from accounts.models import Address

        is_first = not Address.objects.filter(user=user).exists()
        if is_default or is_first:
            Address.objects.filter(user=user, is_default=True).update(is_default=False)
        return Address.objects.create(user=user, is_default=is_default or is_first, **fields)

    @staticmethod
    @transaction.atomic
    def set_default(address: "Address") -> "Address":
        from accounts.models import Address

        Address.objects.filter(user=address.user, is_default=True).exclude(
            pk=address.pk
        ).update(is_default=False)
        address.is_default = True
        address.save(update_fields=["is_default", "updated_at"])
        return address

    @staticmethod
    def clear_default(address: "Address") -> "Address":
        address.is_default = False
        address.save(update_fields=["is_default", "updated_at"])
        return address


#: Every field a shipped order needs. The columns are nullable, but an order
#: without them cannot be delivered.
REQUIRED_SHIPPING_FIELDS = (
    "full_name",
    "phone",
    "address_line",
    "city",
    "postal_code",
    "country",
)


def resolve_shipping_address(
    *, user: Profile, address_id=None, inline: dict | None = None
) -> dict:
    """Resolve a checkout destination from a saved address id or an inline object.

    Raises :class:`common.exceptions.APIError` when nothing was supplied, when the
    referenced address belongs to somebody else, or when the result is incomplete.
    """
    from accounts.models import Address
    from common.exceptions import APIError

    if address_id:
        address = (
            Address.objects.filter(user=user, pk=address_id).first()
            if address_id
            else None
        )
        if address is None:
            raise APIError(
                "That address does not exist.", code="address_not_found", status_code=404
            )
        resolved = address.as_shipping_address()
    elif inline:
        resolved = dict(inline)
    else:
        raise APIError(
            "A shipping address is required.", code="shipping_address_required"
        )

    missing = [
        field
        for field in REQUIRED_SHIPPING_FIELDS
        if not str(resolved.get(field) or "").strip()
    ]
    if missing:
        raise APIError(
            "The shipping address is incomplete.",
            code="shipping_address_incomplete",
            details={"missing": missing},
        )

    normalised = {field: str(resolved[field]).strip() for field in REQUIRED_SHIPPING_FIELDS}
    normalised["country"] = normalised["country"].upper()
    return normalised
