from datetime import timedelta

from django.core.validators import MinValueValidator
from decimal import Decimal
from django.db import models
from django.forms import ValidationError

from apps.companies.models import Company
from apps.core.enums.choices import BusinessStatusChoices
from apps.core.models.base import BaseModel, ActiveManager
from apps.core.utils.validators import CardCodeValidator, validate_card_code


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

    def has_scheme_items(self, scheme_id: str) -> bool:
        """Check if scheme has any associated scheme items across all periods."""
        from apps.schemes.models.scheme_item import SchemeItem
        from apps.schemes.models.scheme_period import SchemePeriod
        period_ids = SchemePeriod.objects.filter(scheme_id=scheme_id).values_list('id', flat=True)
        return SchemeItem.objects.filter(scheme_period_id__in=period_ids).exists()

    def has_members(self, scheme_id: str) -> bool:
        """Check if scheme has any associated members/persons."""
        from apps.members.models import Person
        return Person.all_objects.filter(is_deleted=False, scheme_id=scheme_id).exists()

# ---------------------------------------------------------------------
# Scheme
# ---------------------------------------------------------------------
class Scheme(BaseModel):
    """
    Master scheme entity representing a scheme across all periods.

    Time-specific data (dates, limits) are stored in SchemePeriod model.
    This allows tracking renewals without data loss.
    """
    scheme_name = models.CharField(max_length=255, help_text="Name of the scheme.")
    company = models.ForeignKey(
        Company,
        on_delete=models.PROTECT,
        related_name="schemes",
        help_text="Associated company.",
    )
    card_code = models.CharField(
        max_length=3,
        unique=True,
        validators=[CardCodeValidator()],
        help_text="Unique 3-character alphanumeric code for the scheme (e.g., ABC, X12).",
    )
    description = models.TextField(
        max_length=500, blank=True, help_text="Scheme description."
    )
    is_renewable = models.BooleanField(
        default=True, help_text="Can this scheme be renewed?"
    )
    family_applicable = models.BooleanField(
        default=False, help_text="Applies to family?"
    )
    remark = models.TextField(
        max_length=500, blank=True, help_text="Additional remarks about the scheme."
    )

    objects = SchemeManager()
    all_objects = models.Manager()

    class Meta:
        verbose_name = "Scheme"
        verbose_name_plural = "Schemes"
        db_table = "schemes"

    def clean(self):
        errors = {}

        # Normalize card code to uppercase alphanumeric
        if self.card_code:
            try:
                self.card_code = validate_card_code(self.card_code)
            except ValidationError as e:
                errors["card_code"] = str(e)

        if errors:
            raise ValidationError(errors)

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return self.scheme_name

    # Domain helpers
    def get_current_period(self):
        """Get the current active period for this scheme."""
        return self.periods.filter(is_current=True, is_deleted=False).first()

    def get_period_on_date(self, when_date):
        """Get the period that was active on a specific date."""
        return (
            self.periods.filter(is_deleted=False)
            .filter(start_date__lte=when_date)
            .filter(
                models.Q(termination_date__isnull=True)
                | models.Q(termination_date__gt=when_date)
            )
            .first()
        )

    def is_active_on(self, when_date) -> bool:
        """Check if scheme has an active period on the given date."""
        if self.status != BusinessStatusChoices.ACTIVE:
            return False
        period = self.get_period_on_date(when_date)
        return period is not None and period.is_active_on(when_date)

    def get_renewal_count(self) -> int:
        """
        Get the number of times this scheme has been renewed.

        Returns:
            int: Number of renewals (0 for initial period, 1+ for renewals)

        Example:
            >>> scheme.get_renewal_count()
            2  # Scheme has been renewed twice (on Period 3)
        """
        total_periods = self.periods.filter(is_deleted=False).count()
        return max(0, total_periods - 1)  # Subtract initial period

    def get_last_renewal_date(self):
        """
        Get the date of the most recent renewal.

        Returns:
            date: Date of last renewal, or None if never renewed

        Example:
            >>> scheme.get_last_renewal_date()
            date(2025, 1, 1)  # Last renewed on January 1, 2025
        """
        last_renewed_period = (
            self.periods.filter(is_deleted=False, period_number__gt=1)
            .order_by("-period_number")
            .first()
        )
        return last_renewed_period.renewal_date if last_renewed_period else None

    def get_total_periods(self) -> int:
        """
        Get the total number of periods (including current).

        Returns:
            int: Total number of periods

        Example:
            >>> scheme.get_total_periods()
            3  # Scheme has 3 periods total
        """
        return self.periods.filter(is_deleted=False).count()

    def terminate(self, *, reason: str | None = None, user=None):
        """Terminate scheme and all its periods."""
        self.status = BusinessStatusChoices.INACTIVE
        self.save(update_fields=["status", "updated_at"])

        # Terminate current period if exists
        current_period = self.get_current_period()
        if current_period:
            current_period.terminate(reason=reason, user=user)

    def soft_delete(self, user=None):
        """Prevent deletion when related scheme items or members exist."""
        if Scheme.objects.has_scheme_items(self.id):
            raise ValidationError(
                "Cannot delete scheme with existing scheme items. Remove scheme items first."
            )
        if Scheme.objects.has_members(self.id):
            raise ValidationError(
                "Cannot delete scheme with existing members. Remove or reassign members first."
            )
        super().soft_delete(user=user)


