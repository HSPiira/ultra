from django.core.exceptions import ValidationError
from django.core.validators import MinValueValidator
from decimal import Decimal
from django.db import models

from apps.core.models.base import BaseModel

# ---------------------------------------------------------------------
# Benefit
# ---------------------------------------------------------------------


class PatientTypeChoices(models.TextChoices):
    INPATIENT = "INPATIENT", "Inpatient"
    OUTPATIENT = "OUTPATIENT", "Outpatient"
    BOTH = "BOTH", "Both"


class Benefit(BaseModel):
    benefit_name = models.CharField(max_length=255, help_text="Name of the benefit.")
    description = models.TextField(
        max_length=500, blank=True, help_text="Benefit description."
    )
    in_or_out_patient = models.CharField(
        max_length=20, choices=PatientTypeChoices.choices, help_text="Type of benefit."
    )
    limit_amount = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        null=True,
        blank=True,
        validators=[MinValueValidator(Decimal('0.01'))],
        help_text="Coverage or limit amount.",
    )
    plan = models.ForeignKey(
        'Plan',
        on_delete=models.PROTECT,
        related_name='benefits',
        null=True,
        blank=True,
        help_text="Plan this benefit belongs to."
    )

    class Meta:
        verbose_name = "Benefit"
        verbose_name_plural = "Benefits"
        db_table = "benefits"

        unique_together = ("benefit_name", "in_or_out_patient")

    def clean(self):
        """Validate benefit data."""
        from apps.core.enums.choices import BusinessStatusChoices

        errors = {}

        if self.limit_amount and self.limit_amount < 0:
            errors["limit_amount"] = "Limit amount cannot be negative."

        # Validate that plan is active if provided
        if self.plan and self.plan.status != BusinessStatusChoices.ACTIVE:
            errors["plan"] = "Plan must be active to create or update benefit."

        if errors:
            raise ValidationError(errors)

        return super().clean()

    def __str__(self):
        return self.benefit_name

    def soft_delete(self, user=None):
        """Prevent deletion when benefit is referenced in scheme items."""
        from apps.schemes.models.scheme_item import SchemeItem

        if SchemeItem.all_objects.filter(benefit_id=self.id, is_deleted=False).exists():
            raise ValidationError(
                "Cannot delete benefit with existing scheme items. Remove scheme items first."
            )

        super().soft_delete(user=user)
