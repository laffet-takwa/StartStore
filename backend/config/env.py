"""Environment configuration helpers.

Every runtime knob for StartStore is read from the process environment so that
no secret ever has to live inside the repository. A ``.env`` file living next to
``manage.py`` is loaded automatically for local development.

The helpers are intentionally small and strict: a malformed value raises
:class:`ImproperlyConfiguredEnv` instead of silently falling back to a default
that could weaken production security.
"""

from __future__ import annotations

import os
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Sequence
from urllib.parse import parse_qsl, unquote, urlparse

from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent
PROJECT_DIR = BASE_DIR.parent

# Never fail when the file is absent (CI, containers, real deployments).
load_dotenv(BASE_DIR / ".env")

TRUE_VALUES = frozenset({"1", "true", "t", "yes", "y", "on"})
FALSE_VALUES = frozenset({"0", "false", "f", "no", "n", "off"})

_POSTGRES_SCHEMES = frozenset({"postgres", "postgresql", "psql", "pgsql"})

#: Conventional unprefixed spellings accepted for a few settings, so a host that
#: already exports them does not have to duplicate variables. The namespaced
#: name always takes precedence.
ENV_ALIASES: dict[str, tuple[str, ...]] = {
    "DJANGO_SECRET_KEY": ("SECRET_KEY",),
    "DJANGO_DEBUG": ("DEBUG",),
    "DJANGO_ALLOWED_HOSTS": ("ALLOWED_HOSTS",),
    "SUPABASE_ANON_KEY": ("SUPABASE_PUBLISHABLE_KEY",),
}


#: Values shipped in `.env.example` / the local `.env`. A deployment running
#: with one of these has effectively published its signing key, so every JWT
#: could be forged by anyone who has read the repository.
INSECURE_PLACEHOLDER_SECRETS: frozenset[str] = frozenset(
    {
        "change-me-to-a-50-char-random-string",
        "insecure-development-key-never-use-in-production",
        "dev-only-insecure-key-change-before-deploying-anywhere-real",
        "testing-only-secret-key",
    }
)

#: Minimal entropy check. 50 characters matches Django's own `security.W009`
#: threshold, so passing this guard also clears the framework check.
MIN_SECRET_KEY_LENGTH = 50


class ImproperlyConfiguredEnv(Exception):
    """Raised when the environment is missing or holds an unusable value."""


def assert_secure_secret(value: str | None, *, name: str = "DJANGO_SECRET_KEY") -> str:
    """Validate a production secret, refusing placeholders and short values.

    Raises :class:`ImproperlyConfiguredEnv` rather than booting with a key that
    would let an attacker mint arbitrary access tokens.
    """
    if not value:
        raise ImproperlyConfiguredEnv(f"{name} is required in production")
    if value in INSECURE_PLACEHOLDER_SECRETS:
        raise ImproperlyConfiguredEnv(
            f"{name} is still the example placeholder. Generate a real secret: "
            'python -c "import secrets;print(secrets.token_urlsafe(64))"'
        )
    if len(value) < MIN_SECRET_KEY_LENGTH:
        raise ImproperlyConfiguredEnv(
            f"{name} must be at least {MIN_SECRET_KEY_LENGTH} characters"
        )
    return value


def env_str(name: str, default: str | None = None, *, required: bool = False) -> str | None:
    """Return an environment variable as a stripped string.

    ``*_ALIASES`` lets a couple of conventional unprefixed names work too, so a
    deployment that already exports ``SECRET_KEY`` or ``DEBUG`` does not have to
    rename things. The prefixed name always wins.
    """
    raw = os.environ.get(name)
    for alias in ENV_ALIASES.get(name, ()):
        if raw:
            break
        raw = os.environ.get(alias)
    if raw is None or not raw.strip():
        if required:
            raise ImproperlyConfiguredEnv(f"Missing required environment variable: {name}")
        return default
    return raw.strip()


def env_bool(name: str, default: bool = False) -> bool:
    """Return an environment variable coerced to a boolean."""
    raw = env_str(name)
    if raw is None:
        return default
    lowered = raw.lower()
    if lowered in TRUE_VALUES:
        return True
    if lowered in FALSE_VALUES:
        return False
    raise ImproperlyConfiguredEnv(
        f"Environment variable {name} must be a boolean, got {raw!r}"
    )


def env_int(name: str, default: int | None = None) -> int | None:
    """Return an environment variable coerced to an int."""
    raw = env_str(name)
    if raw is None:
        return default
    try:
        return int(raw)
    except ValueError as exc:
        raise ImproperlyConfiguredEnv(
            f"Environment variable {name} must be an integer, got {raw!r}"
        ) from exc


def env_float(name: str, default: float | None = None) -> float | None:
    """Return an environment variable coerced to a float."""
    raw = env_str(name)
    if raw is None:
        return default
    try:
        return float(raw)
    except ValueError as exc:
        raise ImproperlyConfiguredEnv(
            f"Environment variable {name} must be a number, got {raw!r}"
        ) from exc


def env_list(
    name: str,
    default: Sequence[str] | None = None,
    *,
    separator: str = ",",
) -> list[str]:
    """Return a comma separated environment variable as a list."""
    raw = env_str(name)
    if raw is None:
        return list(default or [])
    return [chunk.strip() for chunk in raw.split(separator) if chunk.strip()]


@dataclass(frozen=True, slots=True)
class DatabaseConfig:
    """Framework agnostic representation of a ``DATABASE_URL``."""

    name: str
    user: str = ""
    password: str = ""
    host: str = ""
    port: str = ""
    engine: str = "django.db.backends.postgresql"
    options: dict[str, Any] = field(default_factory=dict)
    conn_max_age: int = 60
    conn_health_checks: bool = True

    def as_django_settings(self) -> dict[str, Any]:
        """Convert to Django's ``DATABASES["default"]`` mapping."""
        config: dict[str, Any] = {
            "ENGINE": self.engine,
            "CONN_MAX_AGE": self.conn_max_age,
            "CONN_HEALTH_CHECKS": self.conn_health_checks,
            "ATOMIC_REQUESTS": False,
            "OPTIONS": dict(self.options),
        }
        optional = {"NAME": self.name, "USER": self.user, "HOST": self.host, "PORT": self.port}
        config.update({key: value for key, value in optional.items() if value})
        if self.password:
            config["PASSWORD"] = self.password
        return config


def database_config_from_url(url: str, *, conn_max_age: int | None = None) -> DatabaseConfig:
    """Parse a ``postgres://`` style URL into a :class:`DatabaseConfig`.

    Supabase hands out connection strings that always require TLS, e.g.::

        postgresql://postgres:PW@aws-0-x.supabase.com:6543/postgres?sslmode=require
    """
    parsed = urlparse(url)
    if parsed.scheme not in _POSTGRES_SCHEMES:
        raise ImproperlyConfiguredEnv(
            "DATABASE_URL must be a PostgreSQL URL "
            f"(postgres://user:password@host:port/dbname), got scheme {parsed.scheme!r}"
        )

    database_name = unquote(parsed.path).lstrip("/")
    if not database_name:
        raise ImproperlyConfiguredEnv("DATABASE_URL is missing the database name")

    query: dict[str, str] = dict(parse_qsl(parsed.query))
    options: dict[str, Any] = {}

    sslmode = query.pop("sslmode", None)
    if sslmode:
        options["sslmode"] = sslmode
    elif query.pop("ssl", None) == "true":
        options["sslmode"] = "require"

    if "options" in query:
        options.update(parse_qsl(query.pop("options")))

    for passthrough in ("connect_timeout", "application_name"):
        if passthrough in query:
            options[passthrough] = query.pop(passthrough)

    max_age = conn_max_age
    if max_age is None:
        max_age = int(query.pop("conn_max_age", 60))

    return DatabaseConfig(
        name=database_name,
        user=unquote(parsed.username or ""),
        password=unquote(parsed.password or ""),
        host=parsed.hostname or "localhost",
        port=str(parsed.port or 5432),
        options=options,
        conn_max_age=max_age,
    )