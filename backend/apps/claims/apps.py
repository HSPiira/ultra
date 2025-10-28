from django.apps import AppConfig


class ClaimsConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.claims"

    def ready(self):
        from . import models  # noqa: F401
