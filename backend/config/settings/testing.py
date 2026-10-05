"""Settings used by ``manage.py test`` and the CI pipeline.

Kept intentionally fast and deterministic: SQLite in memory, eager password-free
profile creation, throttling disabled.
"""

from __future__ import annotations

from config.settings.base import *  # noqa: F401,F403
from config.settings.base import REST_FRAMEWORK

DEBUG = False

ALLOWED_HOSTS = ["*"]

SECRET_KEY = "testing-only-secret-key"  # noqa: S105 - never used outside tests

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": ":memory:",
        "ATOMIC_REQUESTS": False,
        "TEST": {"NAME": ":memory:"},
    }
}

EMAIL_BACKEND = "django.core.mail.backends.locmem.EmailBackend"

MEDIA_ROOT = None  # keep uploads in memory during tests

CACHES = {
    "default": {
        "BACKEND": "django.core.cache.backends.locmem.LocMemCache",
        "LOCATION": "startstore-tests",
    }
}

REST_FRAMEWORK["DEFAULT_THROTTLE_RATES"] = {  # noqa: F405
    "anon": None,
    "user": None,
    "auth_login": None,
    "auth_register": None,
    "checkout": None,
}
REST_FRAMEWORK["DEFAULT_THROTTLE_CLASSES"] = []  # noqa: F405
REST_FRAMEWORK["DEFAULT_RENDERER_CLASSES"] = ["rest_framework.renderers.JSONRenderer"]  # noqa: F405
