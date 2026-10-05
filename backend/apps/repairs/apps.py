"""
Repairs app config.
"""
from django.apps import AppConfig


class RepairsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.repairs'
    verbose_name = 'Repairs'

    def ready(self):
        pass