"""Authentication endpoints backed by Supabase Auth."""

from __future__ import annotations

import logging

from drf_spectacular.utils import OpenApiResponse, extend_schema
from rest_framework import status
from rest_framework.generics import CreateAPIView, GenericAPIView, RetrieveUpdateAPIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenRefreshView

from accounts.authentication import issue_token_pair
from accounts.models import Profile
from accounts.serializers import (
    LoginSerializer,
    LogoutSerializer,
    ProfileSerializer,
    RegisterSerializer,
)
from accounts.services import (
    ProfileService,
    SupabaseAuthError,
    SupabaseAuthUnavailable,
)
from common.exceptions import APIError

# Imported as a module, not by name, so the gateway lookup stays a single
# patchable seam (``accounts.services.get_supabase_auth_gateway``).
from accounts import services as accounts_services

logger = logging.getLogger("startstore.auth")


class AuthProviderUnavailableError(APIError):
    """Supabase credentials are absent, so sign-in cannot be attempted."""

    default_code = "auth_provider_unavailable"
    default_detail = "Authentication is not configured on this server."

    def __init__(self, message: str | None = None) -> None:
        super().__init__(
            message or "Authentication is not configured on this server.",
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
        )


class RegisterView(CreateAPIView):
    """Create the Supabase auth user and its ``profiles`` row."""

    permission_classes = [AllowAny]
    serializer_class = RegisterSerializer
    throttle_scope = "auth_register"

    @extend_schema(
        tags=["auth"],
        summary="Register an account",
        description=(
            "Creates the account in Supabase Auth and mirrors it into "
            "`public.profiles` with the `customer` role. No password is stored by "
            "Django. Returns the profile; the caller may sign in immediately unless "
            "email confirmation is enabled on the Supabase project."
        ),
        request=RegisterSerializer,
        responses={201: ProfileSerializer, 503: OpenApiResponse(description="Supabase not configured.")},
    )
    def post(self, request, *args, **kwargs) -> Response:
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        gateway = accounts_services.get_supabase_auth_gateway()
        if not gateway.configured:
            raise AuthProviderUnavailableError()

        metadata = {
            key: data[key]
            for key in ("full_name", "phone", "avatar_url")
            if data.get(key)
        }

        try:
            session = gateway.sign_up(
                email=data["email"], password=data["password"], metadata=metadata
            )
            profile = ProfileService.sync_from_supabase(
                {"id": session.user_id, "email": session.email, "user_metadata": metadata},
                allow_role="customer",
            )
        except SupabaseAuthUnavailable as exc:
            raise AuthProviderUnavailableError() from exc
        except SupabaseAuthError as exc:
            raise APIError(
                exc.message,
                code=f"auth_{exc.code}",
                status_code=status.HTTP_400_BAD_REQUEST,
            ) from None

        return Response(
            ProfileSerializer(profile, context=self.get_serializer_context()).data,
            status=status.HTTP_201_CREATED,
        )


class LoginView(GenericAPIView):
    """Verify credentials with Supabase, then mint StartStore tokens."""

    permission_classes = [AllowAny]
    serializer_class = LoginSerializer
    throttle_scope = "auth_login"

    @extend_schema(
        tags=["auth"],
        summary="Obtain a token pair",
        description=(
            "Supabase Auth verifies the password. On success StartStore returns its "
            "own short-lived `access` token plus a rotatable `refresh` token, along "
            "with the synced profile."
        ),
        request=LoginSerializer,
        responses={200: OpenApiResponse(description="access, refresh and user profile.")},
    )
    def post(self, request, *args, **kwargs) -> Response:
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        gateway = accounts_services.get_supabase_auth_gateway()
        if not gateway.configured:
            raise AuthProviderUnavailableError()

        try:
            session = gateway.sign_in_with_password(
                email=data["email"], password=data["password"]
            )
        except SupabaseAuthUnavailable as exc:
            raise AuthProviderUnavailableError() from exc
        except SupabaseAuthError as exc:
            # Never disclose whether the email exists.
            status_code = (
                status.HTTP_401_UNAUTHORIZED
                if exc.code == "invalid_credentials"
                else status.HTTP_400_BAD_REQUEST
            )
            raise APIError(exc.message, code=f"auth_{exc.code}", status_code=status_code) from None

        profile = ProfileService.sync_from_supabase(
            {"id": session.user_id, "email": session.email}
        )

        payload = issue_token_pair(profile)
        payload["user"] = ProfileSerializer(profile, context={"request": request}).data
        return Response(payload)


class RefreshView(TokenRefreshView):
    """Rotate a refresh token and mint a new access token."""

    permission_classes = [AllowAny]

    @extend_schema(
        tags=["auth"],
        summary="Refresh an access token",
        request=None,
        responses={
            200: OpenApiResponse(
                description="A new access token (and refresh token when rotation is on)."
            )
        },
    )
    def post(self, request, *args, **kwargs) -> Response:
        return super().post(request, *args, **kwargs)


class LogoutView(APIView):
    """Revoke refresh tokens, and optionally the Supabase session too."""

    permission_classes = [IsAuthenticated]
    serializer_class = LogoutSerializer

    @extend_schema(
        tags=["auth"],
        summary="Log out",
        description=(
            "Blacklists the supplied refresh token. Send no body (or an empty "
            "`refresh`) to revoke every StartStore session. Including "
            "`supabase_access_token` also ends the GoTrue session."
        ),
        request=LogoutSerializer,
        responses={204: None},
    )
    def post(self, request, *args, **kwargs) -> Response:
        serializer = LogoutSerializer(data=request.data or {})
        serializer.is_valid(raise_exception=True)

        supabase_token = serializer.validated_data.get("supabase_access_token")
        if supabase_token:
            accounts_services.get_supabase_auth_gateway().sign_out(supabase_token)

        refresh_token = serializer.validated_data.get("refresh")
        if refresh_token:
            try:
                token = RefreshToken(refresh_token)
            except TokenError as exc:
                raise APIError(
                    "The supplied refresh token is invalid or already expired.",
                    code="invalid_refresh_token",
                    status_code=status.HTTP_400_BAD_REQUEST,
                ) from exc
            # A JWT claim may come back from JSON as an int or a string.
            if str(token.get("user_id")) != str(request.user.pk):
                raise APIError(
                    "The supplied refresh token does not belong to the authenticated user.",
                    code="refresh_token_mismatch",
                    status_code=status.HTTP_400_BAD_REQUEST,
                )
            token.blacklist()
            return Response(status=status.HTTP_204_NO_CONTENT)

        _revoke_all_sessions(request.user)
        return Response(status=status.HTTP_204_NO_CONTENT)


def _revoke_all_sessions(user: Profile) -> None:
    """Blacklist every outstanding refresh token issued to ``user``."""
    from rest_framework_simplejwt.token_blacklist.models import OutstandingToken

    for record in OutstandingToken.objects.filter(user=user):
        try:
            RefreshToken(record.token).blacklist()
        except TokenError:  # pragma: no cover - already expired or malformed
            continue


class MeView(RetrieveUpdateAPIView):
    """Read or update the authenticated profile."""

    permission_classes = [IsAuthenticated]
    serializer_class = ProfileSerializer

    @extend_schema(tags=["auth"], summary="Current profile", responses={200: ProfileSerializer})
    def get(self, request, *args, **kwargs) -> Response:
        return super().get(request, *args, **kwargs)

    @extend_schema(
        tags=["auth"],
        summary="Update the current profile",
        description="Only `full_name`, `phone` and `avatar_url` can be changed.",
        request=ProfileSerializer,
        responses={200: ProfileSerializer},
    )
    def patch(self, request, *args, **kwargs) -> Response:
        return super().patch(request, *args, **kwargs)

    def get_object(self):
        return self.request.user

    def perform_update(self, serializer) -> None:
        # Mirror the change onto Supabase so the two views stay consistent.
        profile = serializer.save()
        _mirror_to_supabase(profile)


def _mirror_to_supabase(profile: Profile) -> None:
    """Best effort: copy the editable profile fields into GoTrue user metadata."""
    gateway = accounts_services.get_supabase_auth_gateway()
    if not gateway.configured:
        return
    try:
        gateway.update_user_metadata(profile)
    except SupabaseAuthError:
        logger.warning("Could not mirror profile %s to Supabase", profile.pk)
