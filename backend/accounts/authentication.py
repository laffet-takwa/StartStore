"""Authentication classes.

Two bearer tokens are accepted, tried in order:

1. **StartStore JWT** - issued by ``POST /api/auth/login/`` after Supabase has
   verified the password. Short lived, rotatable, blacklisted on logout.
2. **Supabase JWT** - issued directly by GoTrue. Validated against Supabase,
   then the matching ``profiles`` row is synced and used as ``request.user``.

Both paths end with ``request.user`` being a :class:`accounts.models.Profile`,
so every permission class, serializer and service keeps working unchanged.
"""

from __future__ import annotations

import logging

from django.utils.translation import gettext_lazy as _
from rest_framework import exceptions
from rest_framework.authentication import BaseAuthentication, get_authorization_header
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.settings import api_settings as jwt_settings
from rest_framework_simplejwt.tokens import AccessToken, RefreshToken

from accounts.models import Profile

# Imported as a module so the gateway lookup is a single patchable seam.
from accounts import services as accounts_services
from accounts.services import ProfileService, SupabaseAuthError

logger = logging.getLogger("startstore.auth")

#: Issuer claim stamped on every token this project mints, so a foreign JWT is
#: never mistaken for one of ours.
ISSUER = "startstore"


def issue_token_pair(profile: Profile) -> dict:
    """Mint a StartStore access/refresh pair for ``profile``.

    Two details matter here:

    * The user id is stringified because a :class:`~uuid.UUID` is not JSON
      serialisable, which would break ``jwt.encode``. This is also why
      ``RefreshToken.for_user`` cannot be used - it rejects non-int/str ids.
    * ``outstand()`` is called explicitly. SimpleJWT only creates the
      ``OutstandingToken`` row lazily when a token is blacklisted, so skipping
      it would leave "log out everywhere" with nothing to revoke. It resolves the
      owning profile from the ``user_id`` claim above.
    """
    refresh = RefreshToken()
    refresh[jwt_settings.USER_ID_CLAIM] = str(profile.pk)
    refresh["iss"] = ISSUER
    refresh["email"] = profile.email
    refresh["role"] = profile.role
    refresh.outstand()

    return {
        "access": str(refresh.access_token),
        "refresh": str(refresh),
        "expires_in": int(jwt_settings.ACCESS_TOKEN_LIFETIME.total_seconds()),
    }


def _bearer_token(request) -> str | None:
    parts = get_authorization_header(request).split()
    if not parts:
        return None
    scheme = parts[0].decode("iso-8859-1").lower()
    if scheme != "bearer":
        return None
    if len(parts) == 1:
        raise exceptions.AuthenticationFailed(_("Invalid token header. No credentials provided."))
    if len(parts) > 2:
        raise exceptions.AuthenticationFailed(
            _("Invalid token header. Token string should not contain spaces.")
        )
    return parts[1].decode("iso-8859-1")


class StoreJWTAuthentication(BaseAuthentication):
    """Validate the JWTs this project issues."""

    def authenticate(self, request):
        token = _bearer_token(request)
        if not token:
            return None

        try:
            access = AccessToken(token)
        except TokenError:
            # Not one of ours - a Supabase token may follow. Returning None lets
            # the next authenticator try instead of failing the request.
            return None

        if access.get("iss") != ISSUER:
            raise exceptions.AuthenticationFailed(_("This token was not issued by StartStore."))

        try:
            profile = Profile.objects.select_related(None).get(pk=access[jwt_settings.USER_ID_CLAIM])
        except Profile.DoesNotExist:
            raise exceptions.AuthenticationFailed(
                _("This account no longer exists."), code="profile_not_found"
            ) from None
        except (ValueError, TypeError):
            raise exceptions.AuthenticationFailed(_("Malformed token subject.")) from None

        return profile, access

    def authenticate_header(self, request) -> str:
        return 'Bearer realm="api"'


class SupabaseJWTAuthentication(BaseAuthentication):
    """Validate a Supabase access token and sync the profile it belongs to."""

    def authenticate(self, request):
        token = _bearer_token(request)
        if not token:
            return None

        # Cheap local rejection: our own tokens are already handled by the
        # previous authenticator, and a Supabase token always carries this claim.
        if not _looks_like_supabase_token(token):
            return None

        gateway = accounts_services.get_supabase_auth_gateway()
        if not gateway.configured:
            return None

        user = gateway.get_user(token)
        if user is None:
            raise exceptions.AuthenticationFailed(
                _("Supabase token is invalid or expired."), code="invalid_token"
            )

        try:
            profile = ProfileService.sync_from_supabase(user)
        except SupabaseAuthError as exc:
            raise exceptions.AuthenticationFailed(str(exc), code=exc.code) from None

        return profile, token

    def authenticate_header(self, request) -> str:
        return 'Bearer realm="api"'


def _looks_like_supabase_token(token: str) -> bool:
    """Peek at the payload to avoid a network round trip for our own tokens."""
    import base64
    import json

    segments = token.split(".")
    if len(segments) != 3:
        return False
    try:
        payload_segment = segments[1]
        padding = "=" * (-len(payload_segment) % 4)
        payload = json.loads(base64.urlsafe_b64decode(payload_segment + padding))
    except (ValueError, json.JSONDecodeError):
        return False
    if not isinstance(payload, dict):
        return False
    if payload.get("iss") == ISSUER:
        return False
    return bool(payload.get("role") in {"authenticated", "anon"}) or "iss" in payload
