"""OpenAPI security schemes for the two accepted bearer token flavours."""

from __future__ import annotations

from drf_spectacular.extensions import OpenApiAuthenticationExtension


class StoreBearerScheme(OpenApiAuthenticationExtension):
    """Tokens minted by this API after Supabase verified the password."""

    target_class = "accounts.authentication.StoreJWTAuthentication"
    name = "bearerAuth"
    priority = 1

    def get_security_definition(self, auto_schema):
        return {"type": "http", "scheme": "bearer", "bearerFormat": "JWT"}


class SupabaseBearerScheme(OpenApiAuthenticationExtension):
    """Access tokens issued directly by Supabase GoTrue."""

    target_class = "accounts.authentication.SupabaseJWTAuthentication"
    name = "supabaseAuth"
    priority = 0

    def get_security_definition(self, auto_schema):
        return {"type": "http", "scheme": "bearer", "bearerFormat": "JWT"}
