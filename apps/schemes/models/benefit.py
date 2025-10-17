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

    class Meta:
        verbose_name = "Benefit"
        verbose_name_plural = "Benefits"
        db_table = "benefits"

        unique_together = ("benefit_name", "in_or_out_patient")

    def clean(self):
        if self.limit_amount and self.limit_amount < 0:
            raise ValidationError("Limit amount cannot be negative.")
        return super().clean()

    def __str__(self):
        return self.benefit_name
