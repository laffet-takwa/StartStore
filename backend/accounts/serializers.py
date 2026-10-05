"""Serializers for registration, login, profiles and addresses."""

from __future__ import annotations

from rest_framework import serializers

from accounts.constants import UserRole
from accounts.models import Address, Profile
from common.validators import validate_phone_number


class ProfileSerializer(serializers.ModelSerializer):
    """The profile returned by ``/api/auth/me/`` and embedded in a token response.

    ``role`` is read-only: privileges are granted by an administrator through
    ``PATCH /api/admin/users/{id}/``, never by a self-service update.
    """

    class Meta:
        model = Profile
        fields = ("id", "email", "full_name", "phone", "role", "avatar_url", "created_at", "updated_at")
        read_only_fields = ("id", "email", "role", "created_at", "updated_at")

    def validate_avatar_url(self, value):
        if not value:
            return value
        if not value.startswith(("http://", "https://", "/")):
            raise serializers.ValidationError("Use an absolute http(s) URL.")
        return value

    def validate_full_name(self, value):
        if value is None:
            return value
        cleaned = " ".join(value.split())
        if not cleaned:
            # The column is nullable, so an emptied name becomes NULL, not "".
            return None
        return cleaned


class RegisterSerializer(serializers.Serializer):
    """Self-service sign-up.

    The password is handed straight to Supabase Auth, which owns credentials and
    applies its own policy. Django keeps no copy.
    """

    email = serializers.EmailField(max_length=254)
    password = serializers.CharField(
        write_only=True, style={"input_type": "password"}, trim_whitespace=False, min_length=8
    )
    full_name = serializers.CharField(max_length=150, required=False, allow_blank=True)
    phone = serializers.CharField(max_length=32, required=False, allow_blank=True)
    avatar_url = serializers.CharField(max_length=1000, required=False, allow_blank=True)

    def validate_email(self, value: str) -> str:
        email = value.strip().lower()
        if Profile.objects.filter(email__iexact=email).exists():
            raise serializers.ValidationError("An account with this email already exists.")
        return email

    def validate_phone(self, value):
        if value:
            validate_phone_number(value)
        return value


class LoginSerializer(serializers.Serializer):
    """Credentials verified against Supabase Auth."""

    email = serializers.EmailField(max_length=254)
    password = serializers.CharField(
        write_only=True, style={"input_type": "password"}, trim_whitespace=False, min_length=1
    )

    def validate_email(self, value: str) -> str:
        return value.strip().lower()


class LogoutSerializer(serializers.Serializer):
    """Body of ``POST /api/auth/logout/``."""

    refresh = serializers.CharField(
        required=False,
        allow_blank=True,
        help_text="Refresh token to revoke. Omit to revoke every session.",
    )
    supabase_access_token = serializers.CharField(
        required=False,
        allow_blank=True,
        help_text="Optional Supabase token, so the GoTrue session is ended too.",
    )


class AdminProfileSerializer(serializers.ModelSerializer):
    """Staff view of a profile, including role assignment."""

    order_count = serializers.IntegerField(read_only=True, required=False)
    address_count = serializers.IntegerField(read_only=True, required=False)

    class Meta:
        model = Profile
        fields = (
            "id",
            "email",
            "full_name",
            "phone",
            "role",
            "avatar_url",
            "order_count",
            "address_count",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "email", "created_at", "updated_at")

    def validate_role(self, value):
        if value not in dict(UserRole.choices):
            raise serializers.ValidationError("Unknown role.")
        return value


class ShippingAddressSerializer(serializers.Serializer):
    """A delivery destination.

    The column set mirrors ``public.addresses`` so an inline checkout address and
    a saved one produce the identical dictionary on ``orders.shipping_address``.
    ``address_line2`` and ``state`` are not part of the schema and are not accepted.
    """

    full_name = serializers.CharField(max_length=150)
    phone = serializers.CharField(max_length=32)
    address_line = serializers.CharField()
    city = serializers.CharField(max_length=120)
    postal_code = serializers.CharField(max_length=32)
    country = serializers.CharField(min_length=2, max_length=2, help_text="ISO 3166-1 alpha-2, e.g. GB.")

    def validate_country(self, value: str) -> str:
        return value.strip().upper()

    def validate_phone(self, value: str) -> str:
        validate_phone_number(value)
        return value.strip()


class AddressSerializer(serializers.ModelSerializer):
    """A saved address (``public.addresses``)."""

    user_id = serializers.UUIDField(read_only=True)

    class Meta:
        model = Address
        fields = (
            "id",
            "user_id",
            "full_name",
            "phone",
            "address_line",
            "city",
            "postal_code",
            "country",
            "is_default",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "user_id", "created_at", "updated_at")
        extra_kwargs = {
            "is_default": {"required": False},
            "full_name": {"required": False, "allow_blank": True, "allow_null": True},
            "phone": {"required": False, "allow_blank": True, "allow_null": True},
            "city": {"required": False, "allow_blank": True, "allow_null": True},
            "postal_code": {"required": False, "allow_blank": True, "allow_null": True},
            "country": {"required": False, "allow_blank": True, "allow_null": True},
        }

    def validate_country(self, value):
        return value.strip().upper() if value else value

    def validate_phone(self, value):
        if value:
            validate_phone_number(value)
        return value

    def validate(self, attrs):
        attrs = super().validate(attrs)
        instance = self.instance
        country = attrs.get("country", getattr(instance, "country", None))
        if country and len(country) != 2:
            raise serializers.ValidationError(
                {"country": ["Use a two letter ISO 3166-1 alpha-2 code, e.g. GB."]}
            )
        return attrs

    def create(self, validated_data: dict) -> Address:
        from accounts.services import AddressService

        return AddressService.create(user=self.context["request"].user, **validated_data)
