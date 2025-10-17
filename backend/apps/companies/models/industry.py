from django.db import models

from apps.core.models.base import BaseModel, ActiveManager


# ---------------------------------------------------------------------
# Industry
# ---------------------------------------------------------------------
class Industry(BaseModel):
    industry_name = models.CharField(
        max_length=100, unique=True, help_text="Type name."
    )
    description = models.TextField(
        max_length=500, blank=True, help_text="Description of the company type."
    )

    class Meta:
        verbose_name = "Industry"
        verbose_name_plural = "Industries"
        db_table = "industries"

    def __str__(self):
        return self.industry_name


class IndustryManager(ActiveManager):
    def get_by_name(self, name: str):
        return self.filter(industry_name__iexact=name).first()

    def exists_with_name(self, name: str) -> bool:
        return self.filter(industry_name__iexact=name).exists()
