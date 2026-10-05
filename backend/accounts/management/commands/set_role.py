"""Grant or revoke the admin role on a profile.

``public.profiles.role`` is the only privilege column in the schema, so this is
the counterpart of ``createsuperuser`` in a Supabase-owned identity world::

    python manage.py set_role --email admin@startstore.dev --role admin
"""

from __future__ import annotations

from django.core.management.base import BaseCommand, CommandError

from accounts.constants import UserRole
from accounts.models import Profile


class Command(BaseCommand):
    help = "Set the role of an existing profile (customer <-> admin)."

    def add_arguments(self, parser) -> None:
        parser.add_argument(
            "--email", required=True, help="Email of the profile to update."
        )
        parser.add_argument(
            "--role",
            required=True,
            choices=[choice for choice, _ in UserRole.choices],
            help="Role to assign.",
        )
        parser.add_argument(
            "--create-missing",
            action="store_true",
            help=(
                "Create a placeholder profile when no row exists yet. Only valid for "
                "an address the matching Supabase auth user actually has - the id "
                "cannot be invented."
            ),
        )
        parser.add_argument(
            "--auth-user-id",
            default="",
            help="auth.users id, required together with --create-missing.",
        )

    def handle(self, *args, **options) -> None:
        email = options["email"].strip().lower()
        role = options["role"]

        profile = Profile.objects.filter(email__iexact=email).first()

        if profile is None:
            if not options["create_missing"]:
                raise CommandError(
                    f"No profile row for {email}. Sign the account up through "
                    "POST /api/auth/register/ first, or pass --create-missing "
                    "--auth-user-id <uuid>."
                )
            auth_user_id = options["auth_user_id"].strip()
            if not auth_user_id:
                raise CommandError("--create-missing requires --auth-user-id <uuid>.")
            profile = Profile(id=auth_user_id, email=email)

        previous = profile.role
        profile.role = role
        profile.save(update_fields=["role", "updated_at"])

        self.stdout.write(
            self.style.SUCCESS(
                f"{profile.email}: {previous} -> {profile.role}"
            )
        )
        if role == UserRole.ADMIN:
            self.stdout.write(
                "This profile can now reach /api/admin/ endpoints with its own token."
            )
