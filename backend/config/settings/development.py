"""Local development settings.

* ``DEBUG = True`` and the browsable API renderer are enabled.
* SQLite is used when ``USE_SQLITE=true`` so the project boots before a
  Supabase database has been wired up.
"""

from __future__ import annotations

from config.settings.base import *  # noqa: F401,F403
from config.settings.base import REST_FRAMEWORK, SPECTACULAR_SETTINGS  # noqa: F401

DEBUG = True

ALLOWED_HOSTS = ["*"]

SECURE_SSL_REDIRECT = False

REST_FRAMEWORK["DEFAULT_RENDERER_CLASSES"] = [  # noqa: F405
    "rest_framework.renderers.JSONRenderer",
    "rest_framework.renderers.BrowsableAPIRenderer",
]

SPECTACULAR_SETTINGS["SERVE_INCLUDE_SCHEMA"] = False  # noqa: F405