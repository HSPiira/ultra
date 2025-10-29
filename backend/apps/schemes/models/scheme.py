from datetime import timedelta

from django.core.validators import MinValueValidator
from decimal import Decimal
from django.db import models
from django.forms import ValidationError

from apps.companies.models import Company
from apps.core.enums.choices import BusinessStatusChoices
from apps.core.models.base import BaseModel, ActiveManager


class SchemeManager(ActiveManager):
    def active(self):
        return self.filter(status=BusinessStatusChoices.ACTIVE)

    def for_company(self, company_id: str):
        return self.filter(company_id=company_id)

    def active_on(self, when_date):
        return (
            self.filter(start_date__lte=when_date)
            .filter(
                models.Q(termination_date__isnull=True)
                | models.Q(termination_date__gt=when_date)
            )
            .filter(status=BusinessStatusChoices.ACTIVE)
        )

# ---------------------------------------------------------------------
# Scheme
# ---------------------------------------------------------------------
class Scheme(BaseModel):
    scheme_name = models.CharField(max_length=255, help_text="Name of the scheme.")
    company = models.ForeignKey(
        Company,
        on_delete=models.CASCADE,
        related_name="schemes",
        help_text="Associated company.",
    )
    card_code = models.CharField(
        max_length=3, unique=True, help_text="Unique code for the scheme."
    )
    description = models.TextField(
        max_length=500, blank=True, help_text="Scheme description."
    )
    start_date = models.DateField(help_text="Start date.")
    end_date = models.DateField(help_text="End date.")
    termination_date = models.DateField(
        null=True, blank=True, help_text="Termination date."
    )
    limit_amount = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'))],
        help_text="Coverage or limit amount.",
    )
    family_applicable = models.BooleanField(
        default=False, help_text="Applies to family?"
    )
    remark = models.TextField(
        max_length=500, blank=True, help_text="Additional remarks."
    )

    objects = SchemeManager()
    all_objects = models.Manager()

    class Meta:
        verbose_name = "Scheme"
        verbose_name_plural = "Schemes"
        db_table = "nm_schemes"

    def clean(self):
        errors = {}
        if self.start_date and self.end_date and self.start_date >= self.end_date:
            errors["end_date"] = "End date must be after start date."
        if (
            self.termination_date
            and self.end_date
            and self.termination_date <= self.end_date
        ):
            errors["termination_date"] = "Termination date must be after end date."
        if errors:
            raise ValidationError(errors)

    def save(self, *args, **kwargs):
        if self.end_date and not self.termination_date:
            # Handle both date and string types
            if isinstance(self.end_date, str):
                from datetime import datetime
                end_date = datetime.strptime(self.end_date, '%Y-%m-%d').date()
            else:
                end_date = self.end_date
            self.termination_date = end_date + timedelta(days=1)
        self.full_clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return self.scheme_name

    # Domain helpers
    def is_active_on(self, when_date) -> bool:
        if self.status != BusinessStatusChoices.ACTIVE:
            return False
        if self.start_date and when_date < self.start_date:
            return False
        return not (self.termination_date and when_date >= self.termination_date)

    def terminate(self, *, reason: str | None = None, user=None):
        """Terminate scheme and mark as inactive."""
        self.status = BusinessStatusChoices.INACTIVE
        if not self.termination_date and self.end_date:
            # Handle both date and string types
            if isinstance(self.end_date, str):
                from datetime import datetime
                end_date = datetime.strptime(self.end_date, '%Y-%m-%d').date()
            else:
                end_date = self.end_date
            self.termination_date = end_date + timedelta(days=1)
        self.save(update_fields=["status", "termination_date", "updated_at"])


