"""The StartStore profile model.

Supabase Auth owns identity: ``public.profiles.id`` is a foreign key to
``auth.users.id`` and passwords never live in this database. That makes Django
a *business* layer rather than the credential store, so this module has no
password field, no permission groups and no ``is_active`` flag.

Consequences that shape the whole project:

* There is no ``django.contrib.admin`` and no session auth - see
  :mod:`accounts.authentication` for the two JWT paths that replace them.
* ``Profile`` still exposes ``is_authenticated`` / ``is_anonymous`` so DRF's
  permission classes work unchanged, plus ``is_admin`` so a single ``role``
  column is the one source of truth for privileges.
* ``role`` is deliberately *not* synced to a separate column: the schema has
  only these seven, and the CHECK constraint in Postgres is the backstop.
"""

from __future__ import annotations

import uuid

from django.db import models

from accounts.constants import UserRole
from common.validators import validate_phone_number

#: Columns of ``public.profiles`` that are nullable in the database.
_NULLABLE_PROFILE_FIELDS = ("full_name", "phone", "avatar_url")


class ProfileQuerySet(models.QuerySet):
    def customers(self):
        return self.filter(role=UserRole.CUSTOMER)

    def admins(self):
        return self.filter(role=UserRole.ADMIN)

    def with_order_counts(self):
        return self.annotate(order_count=models.Count("orders"))


class Profile(models.Model):
    """A customer or administrator, mirrored from ``auth.users``."""

    # Supabase assigns this id (auth.users.id) and it must never change, so it is
    # supplied by the auth layer rather than generated locally.
    id = models.UUIDField(primary_key=True, editable=False, verbose_name="auth user id")
    email = models.EmailField("email address", unique=True, max_length=254)
    full_name = models.CharField(max_length=150, null=True, blank=True)
    phone = models.CharField(
        max_length=32, null=True, blank=True, default=None, validators=[validate_phone_number]
    )
    role = models.CharField(
        max_length=20,
        choices=UserRole.choices,
        default=UserRole.CUSTOMER,
        db_index=True,
    )
    avatar_url = models.TextField(blank=True, default=None, null=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = ProfileQuerySet.as_manager()

    #: django.contrib.auth's contract for a user model. The "username" is the
    #: email; the password column that AbstractBaseUser would add is deliberately
    #: absent because Supabase Auth stores credentials.
    USERNAME_FIELD = "email"
    REQUIRED_FIELDS: list[str] = []

    class Meta:
        db_table = "profiles"
        ordering = ("-created_at",)
        verbose_name = "profile"
        verbose_name_plural = "profiles"

    def __str__(self) -> str:
        return self.email or str(self.pk)

    def save(self, *args, **kwargs) -> None:
        if self.pk is None:
            # profiles.id is a foreign key to auth.users.id, so it cannot be
            # generated locally. Failing here beats an opaque NOT NULL error.
            raise ValueError(
                "Profile.id must be supplied by Supabase Auth (auth.users.id). "
                "Create the profile through ProfileService.sync_from_supabase()."
            )
        if self.email:
            self.email = self.email.strip().lower()
        # The columns are nullable; store an absent value as NULL, not "",
        # so `IS NULL` queries stay meaningful.
        for field in _NULLABLE_PROFILE_FIELDS:
            if getattr(self, field) == "":
                setattr(self, field, None)
        super().save(*args, **kwargs)

    # --- Identity surface expected by DRF ----------------------------------- #
    @property
    def is_authenticated(self) -> bool:
        return True

    @property
    def is_anonymous(self) -> bool:
        return False

    @property
    def is_admin(self) -> bool:
        return self.role == UserRole.ADMIN

    #: Django admin naming, kept so permission helpers can stay generic.
    is_staff = is_admin

    @property
    def is_active(self) -> bool:
        """Mirror of Supabase's ``banned``/``deleted`` flag, applied on sync."""
        return not getattr(self, "_banned", False)

    @property
    def display_name(self) -> str:
        return self.full_name or self.email

    def get_full_name(self) -> str:
        return self.full_name or ""

    def get_short_name(self) -> str:
        return (self.full_name or self.email).split(" ")[0]


class AddressQuerySet(models.QuerySet):
    def for_profile(self, profile: Profile):
        return self.filter(user=profile)

    def default_for(self, profile: Profile):
        return self.filter(user=profile, is_default=True).first()


class Address(models.Model):
    """One of a profile's saved delivery addresses (``public.addresses``)."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(Profile, on_delete=models.CASCADE, related_name="addresses")
    full_name = models.CharField(max_length=150, null=True, blank=True)
    phone = models.CharField(
        max_length=32, null=True, blank=True, default=None, validators=[validate_phone_number]
    )
    address_line = models.TextField()
    city = models.CharField(max_length=120, null=True, blank=True)
    postal_code = models.CharField(max_length=32, null=True, blank=True)
    country = models.CharField(max_length=2, null=True, blank=True)
    is_default = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = AddressQuerySet.as_manager()

    class Meta:
        db_table = "addresses"
        ordering = ("-is_default", "-created_at")
        indexes = [
            models.Index(fields=["user", "-is_default"], name="address_user_default_idx"),
        ]

    def __str__(self) -> str:
        return f"{self.address_line}, {self.city or '-'}"

    def save(self, *args, **kwargs) -> None:
        if self.country:
            self.country = self.country.strip().upper()
        super().save(*args, **kwargs)

    def as_shipping_address(self) -> dict:
        """The dictionary shape stored on ``orders.shipping_address``."""
        return {
            "full_name": self.full_name,
            "phone": self.phone,
            "address_line": self.address_line,
            "city": self.city,
            "postal_code": self.postal_code,
            "country": self.country,
        }


class AnonymousProfile:
    """Stand-in for ``request.user`` when nobody is authenticated.

    Implements exactly the attributes DRF and the permission classes touch, so
    an unauthenticated request flows through the same code paths as an
    authenticated one.
    """

    pk = None
    id = None
    email = ""
    full_name = None
    phone = None
    avatar_url = ""
    role = None
    is_authenticated = False
    is_anonymous = True
    is_admin = False
    is_staff = False
    is_active = False
    display_name = "Anonymous"

    def __str__(self) -> str:
        return "AnonymousProfile"

    def get_full_name(self) -> str:
        return ""

    def get_short_name(self) -> str:
        return ""


def new_uuid() -> uuid.UUID:
    """Primary key factory for tables the database lets us own."""
    return uuid.uuid4()
