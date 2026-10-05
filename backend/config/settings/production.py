"""Production settings.

Every security sensitive value is mandatory here, which makes an
under-configured deployment fail fast and loudly instead of silently running
in a permissive mode.
"""

from __future__ import annotations

from config.env import ImproperlyConfiguredEnv, assert_secure_secret, env_bool, env_list, env_str
from config.settings.base import *  # noqa: F401,F403
from config.settings.base import REST_FRAMEWORK, SPECTACULAR_SETTINGS  # noqa: F401

DEBUG = False

# Refuses the example placeholder and any key shorter than 50 characters. Without
# this check a deployment could silently ship the documented default signing key,
# which would let anyone forge access tokens.
assert_secure_secret(env_str("DJANGO_SECRET_KEY"))

_allowed_hosts = env_list("DJANGO_ALLOWED_HOSTS")
if not _allowed_hosts:
    raise ImproperlyConfiguredEnv("DJANGO_ALLOWED_HOSTS is required in production")
ALLOWED_HOSTS = _allowed_hosts

if env_bool("USE_SQLITE", False):
    raise ImproperlyConfiguredEnv("USE_SQLITE must be false in production")

if not env_str("SUPABASE_URL") or not env_str("SUPABASE_ANON_KEY"):
    raise ImproperlyConfiguredEnv(
        "SUPABASE_URL and SUPABASE_ANON_KEY are required in production: they verify "
        "sign-in and create the profile rows."
    )

REST_FRAMEWORK["DEFAULT_RENDERER_CLASSES"] = ["rest_framework.renderers.JSONRenderer"]  # noqa: F405

# Force HTTPS end to end.
SECURE_SSL_REDIRECT = True
SECURE_HSTS_SECONDS = 31_536_000  # 1 year
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")

SECURE_REFERRER_POLICY = "strict-origin-when-cross-origin"

# Derived from DEBUG in base.py, so it must be restated here: base computes these
# before this module sets DEBUG = False.
CSRF_COOKIE_SECURE = True
SECURE_SSL_REDIRECT = True

# The SPA talks to this API with bearer tokens; no cookie jar is involved.
CORS_ALLOWED_ORIGINS = env_list("CORS_ALLOWED_ORIGINS")
if not CORS_ALLOWED_ORIGINS:
    raise ImproperlyConfiguredEnv("CORS_ALLOWED_ORIGINS is required in production")

SPECTACULAR_SETTINGS["SERVE_INCLUDE_SCHEMA"] = False  # noqa: F405