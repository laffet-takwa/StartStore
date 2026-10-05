from django.apps import AppConfig


class AccountsConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "accounts"
    verbose_name = "Accounts"

    def ready(self) -> None:
        # Importing the module is enough: drf-spectacular registers every
        # OpenApi*Extension subclass at class creation time, so this documents
        # our two bearer schemes in the schema.
        from accounts import schema  # noqa: F401