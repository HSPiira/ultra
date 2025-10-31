from django.core.exceptions import ValidationError
from django.db import models

from apps.core.models.base import BaseModel, ActiveManager


# ---------------------------------------------------------------------
# Managers
# ---------------------------------------------------------------------
class IndustryManager(ActiveManager):
    def get_by_name(self, name: str):
        return self.filter(industry_name__iexact=name).first()

    def exists_with_name(self, name: str) -> bool:
        return self.filter(industry_name__iexact=name).exists()

    def has_companies(self, industry_id: str) -> bool:
        """Check if industry has any associated companies."""
        from apps.companies.models.company import Company
        return Company.objects.filter(industry_id=industry_id).exists()


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

    # Managers
    objects = IndustryManager()

    class Meta:
        verbose_name = "Industry"
        verbose_name_plural = "Industries"
        db_table = "industries"

    def __str__(self):
        return self.industry_name

    def soft_delete(self, user=None):
        """Prevent deletion when related companies exist."""
        if Industry.objects.has_companies(self.id):
            raise ValidationError(
                "Cannot delete industry with existing companies. Remove or reassign companies first."
            )
        super().soft_delete(user=user)
