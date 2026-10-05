"""Base Django settings shared by every environment.

Identity lives in Supabase Auth, not in this database. That single fact drives
several choices here: ``django.contrib.admin``/``auth``/``sessions`` are not
installed, the DRF authenticators live in ``accounts.authentication``, and
``UNAUTHENTICATED_USER`` is a project type rather than Django's
``AnonymousUser`` (which cannot be imported without the auth app).

Environment specific overrides live in the sibling modules
``development``, ``testing`` and ``production``.
"""

from __future__ import annotations

from datetime import timedelta

from config.env import (
    BASE_DIR,
    ImproperlyConfiguredEnv,
    env_bool,
    env_float,
    env_int,
    env_list,
    env_str,
)

# --------------------------------------------------------------------------- #
# Core
# --------------------------------------------------------------------------- #
SECRET_KEY = env_str("DJANGO_SECRET_KEY") or "insecure-development-key-never-use-in-production"

DEBUG = env_bool("DJANGO_DEBUG", False)

ALLOWED_HOSTS = env_list("DJANGO_ALLOWED_HOSTS", ["localhost", "127.0.0.1"])

CSRF_TRUSTED_ORIGINS = env_list("DJANGO_CSRF_TRUSTED_ORIGINS", [])

ROOT_URLCONF = "config.urls"
WSGI_APPLICATION = "config.wsgi.application"
ASGI_APPLICATION = "config.asgi.application"

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# --------------------------------------------------------------------------- #
# Applications
# --------------------------------------------------------------------------- #
DJANGO_APPS = [
    "django.contrib.contenttypes",
    # Required, not optional: SimpleJWT imports django.contrib.auth.models.
    # Password authentication is explicitly disabled below, and AUTH_USER_MODEL
    # points at accounts.Profile, so the only effect is the framework's own
    # permission tables.
    "django.contrib.auth",
    "django.contrib.staticfiles",
]

THIRD_PARTY_APPS = [
    "rest_framework",
    "corsheaders",
    "django_filters",
    "drf_spectacular",
    # Provides refresh-token revocation. It points AUTH_USER_MODEL at
    # accounts.Profile, so the blacklist rows reference profiles.id.
    "rest_framework_simplejwt.token_blacklist",
]

LOCAL_APPS = [
    "common",
    "accounts",
    "categories",
    "products",
    "cart",
    "wishlist",
    "orders",
    "payments",
    "employees",
    "customers",
    "devices",
    "repairs",
    "suppliers",
    "inventory",
    "sales",
    "invoices",
    "content",
    "robotics",
    "notifications",
    "reports",
]

INSTALLED_APPS = [*DJANGO_APPS, *THIRD_PARTY_APPS, *LOCAL_APPS]

# No SessionMiddleware and no AuthenticationMiddleware: every request carries a
# bearer token and request.user is resolved by the DRF authenticators.
MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [BASE_DIR / "templates"],
        "APP_DIRS": True,
        "OPTIONS": {"context_processors": ["django.template.context_processors.request"]},
    },
]

# --------------------------------------------------------------------------- #
# Database
# --------------------------------------------------------------------------- #
USE_SQLITE = env_bool("USE_SQLITE", False)


def _build_databases() -> dict[str, dict]:
    if USE_SQLITE:
        return {
            "default": {
                "ENGINE": "django.db.backends.sqlite3",
                "NAME": BASE_DIR / "db.sqlite3",
                "ATOMIC_REQUESTS": False,
                "OPTIONS": {"timeout": 20},
            }
        }

    database_url = env_str("DATABASE_URL")
    if not database_url:
        raise ImproperlyConfiguredEnv(
            "DATABASE_URL is required unless USE_SQLITE=true. See .env.example."
        )

    from config.env import database_config_from_url  # local import: avoids cycle

    config = database_config_from_url(
        database_url, conn_max_age=env_int("DATABASE_CONN_MAX_AGE", 60)
    )
    return {"default": config.as_django_settings()}


DATABASES = _build_databases()

# --------------------------------------------------------------------------- #
# Identity
# --------------------------------------------------------------------------- #
# The profile table is the user table. Supabase Auth stores the password and
# signs the primary session; Django only mints its own short-lived API tokens.
AUTH_USER_MODEL = "accounts.Profile"

# Credentials live in Supabase Auth. Emptying this list removes any local
# password authentication path entirely, so nothing can accidentally fall back
# to checking a password against a profile that has none.
AUTHENTICATION_BACKENDS: list[str] = []

SUPABASE_URL = env_str("SUPABASE_URL", "") or ""
SUPABASE_ANON_KEY = env_str("SUPABASE_ANON_KEY", "") or ""
# Never read by any module. Present in .env only so it is available to a future
# server-side integration that genuinely needs it.
SUPABASE_STORAGE_BUCKET = env_str("SUPABASE_STORAGE_BUCKET", "") or ""
SUPABASE_AUTH_TIMEOUT = env_float("SUPABASE_AUTH_TIMEOUT", 10.0)

SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=env_int("JWT_ACCESS_TOKEN_LIFETIME_MINUTES", 30)),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=env_int("JWT_REFRESH_TOKEN_LIFETIME_DAYS", 7)),
    "ROTATE_REFRESH_TOKENS": env_bool("JWT_ROTATE_REFRESH_TOKENS", True),
    "BLACKLIST_AFTER_ROTATION": env_bool("JWT_BLACKLIST_AFTER_ROTATION", True),
    "ALGORITHM": "HS256",
    "SIGNING_KEY": env_str("JWT_SIGNING_KEY") or SECRET_KEY,
    "VERIFYING_KEY": env_str("JWT_VERIFYING_KEY") or None,
    "AUTH_HEADER_TYPES": ("Bearer",),
    "AUTH_HEADER_NAME": "HTTP_AUTHORIZATION",
    "USER_ID_FIELD": "id",
    "USER_ID_CLAIM": "user_id",
    "TOKEN_TYPE_CLAIM": "token_type",
    "JTI_CLAIM": "jti",
    # profiles has no last_login column.
    "UPDATE_LAST_LOGIN": False,
}

# --------------------------------------------------------------------------- #
# Internationalisation
# --------------------------------------------------------------------------- #
LANGUAGE_CODE = env_str("DJANGO_LANGUAGE_CODE", "en-us")
TIME_ZONE = env_str("DJANGO_TIME_ZONE", "UTC")
USE_I18N = True
USE_TZ = True

# --------------------------------------------------------------------------- #
# Static files & user uploaded media
# --------------------------------------------------------------------------- #
STATIC_URL = "static/"
STATIC_ROOT = BASE_DIR / "staticfiles"
STATICFILES_DIRS = [BASE_DIR / "static"]

MEDIA_URL = "media/"
MEDIA_ROOT = BASE_DIR / "media"

STORAGES = {
    "default": {"BACKEND": "django.core.files.storage.FileSystemStorage"},
    "staticfiles": {"BACKEND": "whitenoise.storage.CompressedStaticFilesStorage"},
}

MEDIA_UPLOAD_MAX_MEMORY_SIZE = env_int("MEDIA_UPLOAD_MAX_MEMORY_SIZE", 10 * 1024 * 1024)

# --------------------------------------------------------------------------- #
# CORS
# --------------------------------------------------------------------------- #
CORS_ALLOWED_ORIGINS = env_list(
    "CORS_ALLOWED_ORIGINS",
    ["http://localhost:5173", "http://localhost:3000"],
)
CORS_ALLOW_CREDENTIALS = True
CORS_EXPOSE_HEADERS = ["Content-Disposition", "X-Request-Id"]
CORS_ALLOWED_METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"]

# --------------------------------------------------------------------------- #
# Django REST Framework
# --------------------------------------------------------------------------- #
REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "accounts.authentication.StoreJWTAuthentication",
        "accounts.authentication.SupabaseJWTAuthentication",
    ),
    "DEFAULT_PERMISSION_CLASSES": ("rest_framework.permissions.AllowAny",),
    "DEFAULT_PAGINATION_CLASS": "common.pagination.DefaultPagination",
    "PAGE_SIZE": 12,
    "DEFAULT_FILTER_BACKENDS": (
        "django_filters.rest_framework.DjangoFilterBackend",
        "rest_framework.filters.OrderingFilter",
        "rest_framework.filters.SearchFilter",
    ),
    "DEFAULT_SCHEMA_CLASS": "drf_spectacular.openapi.AutoSchema",
    "EXCEPTION_HANDLER": "common.exceptions.api_exception_handler",
    # Django's AnonymousUser cannot be imported without django.contrib.auth.
    "UNAUTHENTICATED_USER": "accounts.models.AnonymousProfile",
    "DEFAULT_THROTTLE_CLASSES": (
        "rest_framework.throttling.AnonRateThrottle",
        "rest_framework.throttling.UserRateThrottle",
        "rest_framework.throttling.ScopedRateThrottle",
    ),
    "DEFAULT_THROTTLE_RATES": {
        "anon": env_str("THROTTLE_ANON_RATE", "300/hour"),
        "user": env_str("THROTTLE_USER_RATE", "2000/hour"),
        "auth_login": env_str("THROTTLE_AUTH_LOGIN_RATE", "10/minute"),
        "auth_register": env_str("THROTTLE_AUTH_REGISTER_RATE", "10/hour"),
        "checkout": env_str("THROTTLE_CHECKOUT_RATE", "60/hour"),
    },
    "DATETIME_FORMAT": "iso-8601",
    "TEST_REQUEST_DEFAULT_FORMAT": "json",
}

SPECTACULAR_SETTINGS = {
    "TITLE": "StartStore API",
    "DESCRIPTION": (
        "REST API for the StartStore e-commerce MVP.\n\n"
        "**Authentication** is a bearer token. Either sign in through "
        "`POST /api/auth/login/` (Supabase verifies the password, StartStore "
        "returns its own access/refresh pair) or send a Supabase access token "
        "directly. Refresh with `POST /api/auth/refresh/` and revoke with "
        "`POST /api/auth/logout/`."
    ),
    "VERSION": "1.0.0",
    "SERVE_INCLUDE_SCHEMA": False,
    "COMPONENT_SPLIT_REQUEST": True,
    "COMPONENT_SPLIT_PATCH": True,
    "SORT_OPERATIONS": False,
    "SCHEMA_PATH_PREFIX": "/api",
    "SERVE_PERMISSIONS": ["rest_framework.permissions.AllowAny"],
    "SERVE_AUTHENTICATION": [],
    "SWAGGER_UI_DIST": "SIDECAR",
    "SWAGGER_UI_FACETS": ["auth"],
    "SWAGGER_UI_SETTINGS": {
        "persistAuthorization": True,
        "displayRequestDuration": True,
        "docExpansion": "none",
    },
    "REDOC_DIST": "SIDECAR",
    "SECURITY": [{"bearerAuth": []}, {"supabaseAuth": []}],
    "TAGS": [
        {"name": "auth", "description": "Registration, login, token refresh and profile."},
        {"name": "addresses", "description": "Saved shipping addresses."},
        {"name": "categories", "description": "Product categories. Admin managed."},
        {"name": "products", "description": "Catalogue. Public read, admin write."},
        {"name": "cart", "description": "Authenticated shopper's cart."},
        {"name": "wishlist", "description": "Authenticated shopper's wishlist."},
        {"name": "orders", "description": "Checkout and order history."},
        {"name": "admin", "description": "Staff only operations and reporting."},
    ],
    "ENUM_NAME_OVERRIDES": {
        "OrderStatusEnum": "common.constants.OrderStatus.choices",
        "PaymentStatusEnum": "common.constants.PaymentStatus.choices",
        "UserRoleEnum": "accounts.constants.UserRole.choices",
    },
}

# --------------------------------------------------------------------------- #
# Store wide configuration
#
# These are namespaced with STARTSTORE_ on purpose. Bare names such as
# `CURRENCY` collide with variables Windows already exports for the user's
# locale (`CURRENCY=TND` on an en-TN machine), which would silently override the
# project setting. Namespacing removes the whole class of collision.
# --------------------------------------------------------------------------- #
STARTSTORE_CURRENCY = env_str("STARTSTORE_CURRENCY", "TND")
STARTSTORE_SHIPPING_FLAT_RATE = env_float("STARTSTORE_SHIPPING_FLAT_RATE", 9.99)
STARTSTORE_FREE_SHIPPING_THRESHOLD = env_float("STARTSTORE_FREE_SHIPPING_THRESHOLD", 100.00)
STARTSTORE_CART_ITEM_MAX_QUANTITY = env_int("STARTSTORE_CART_ITEM_MAX_QUANTITY", 99)

# --------------------------------------------------------------------------- #
# Cache (used by throttling). Swap for Redis in multi-worker deployments.
# --------------------------------------------------------------------------- #
CACHES = {
    "default": {
        "BACKEND": "django.core.cache.backends.locmem.LocMemCache",
        "LOCATION": "startstore-default",
    }
}

# --------------------------------------------------------------------------- #
# Security defaults. Production tightens these further.
# --------------------------------------------------------------------------- #
SECURE_CONTENT_TYPE_NOSNIFF = True
SECURE_REFERRER_POLICY = "same-origin"
X_FRAME_OPTIONS = "DENY"

# There are no session cookies; CSRF still guards any future cookie flow.
CSRF_COOKIE_SECURE = not DEBUG
CSRF_COOKIE_HTTPONLY = False

SECURE_SSL_REDIRECT = env_bool("DJANGO_SECURE_SSL_REDIRECT", False)
SECURE_PROXY_SSL_HEADER = (
    ("HTTP_X_FORWARDED_PROTO", "https")
    if env_str("DJANGO_SECURE_PROXY_SSL_HEADER")
    else None
)

# --------------------------------------------------------------------------- #
# Logging
# --------------------------------------------------------------------------- #
LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "verbose": {"format": "{levelname} {asctime} {name} {message}", "style": "{"},
        "simple": {"format": "{levelname} {message}", "style": "{"},
    },
    "handlers": {
        "console": {"class": "logging.StreamHandler", "formatter": "simple"},
    },
    "root": {"handlers": ["console"], "level": env_str("DJANGO_LOG_LEVEL", "INFO")},
    "loggers": {
        "django.db.backends": {"level": "WARNING", "handlers": ["console"], "propagate": False},
        "startstore": {"level": env_str("DJANGO_LOG_LEVEL", "INFO"), "handlers": ["console"], "propagate": False},
    },
}