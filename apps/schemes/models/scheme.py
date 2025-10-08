from django.db import models
from django.core.validators import MinValueValidator
from django.forms import ValidationError
from datetime import timedelta
from apps.companies.models import Company
from apps.core.models.base import BaseModel

# ---------------------------------------------------------------------
# Scheme
# ---------------------------------------------------------------------
class Scheme(BaseModel):
    scheme_name = models.CharField(max_length=255, help_text="Name of the scheme.")
    company = models.ForeignKey(
        Company, on_delete=models.CASCADE, related_name="schemes", help_text="Associated company."
    )
    card_code = models.CharField(max_length=3, unique=True, help_text="Unique code for the scheme.")
    description = models.TextField(max_length=500, blank=True, help_text="Scheme description.")
    start_date = models.DateField(help_text="Start date.")
    end_date = models.DateField(help_text="End date.")
    termination_date = models.DateField(null=True, blank=True, help_text="Termination date.")
    limit_amount = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        validators=[MinValueValidator(0.01)],
        help_text="Coverage or limit amount.",
    )
    family_applicable = models.BooleanField(default=False, help_text="Applies to family?")
    remark = models.TextField(max_length=500, blank=True, help_text="Additional remarks.")

    class Meta:
        verbose_name = "Scheme"
        verbose_name_plural = "Schemes"
        db_table = "nm_schemes"

    def clean(self):
        errors = {}
        if self.start_date and self.end_date and self.start_date >= self.end_date:
            errors["end_date"] = "End date must be after start date."
        if self.termination_date and self.end_date and self.termination_date <= self.end_date:
            errors["termination_date"] = "Termination date must be after end date."
        if errors:
            raise ValidationError(errors)

    def save(self, *args, **kwargs):
        if self.end_date and not self.termination_date:
            self.termination_date = self.end_date + timedelta(days=1)
        self.full_clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return self.scheme_name