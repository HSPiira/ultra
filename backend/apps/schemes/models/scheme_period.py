from datetime import timedelta
from decimal import Decimal

from django.core.validators import MinValueValidator
from django.db import models
from django.forms import ValidationError

from apps.core.enums.choices import BusinessStatusChoices
from apps.core.models.base import BaseModel, ActiveManager


class SchemePeriodManager(ActiveManager):
    """Manager for SchemePeriod with custom query methods."""

    def current(self):
        """Get all current/active periods."""
        return self.filter(is_current=True, status=BusinessStatusChoices.ACTIVE)

    def for_scheme(self, scheme_id: str):
        """Get all periods for a specific scheme."""
        return self.filter(scheme_id=scheme_id).order_by("-period_number")

    def active_on(self, when_date):
        """Get periods active on a specific date."""
        return (
            self.filter(start_date__lte=when_date)
            .filter(
                models.Q(termination_date__isnull=True)
                | models.Q(termination_date__gt=when_date)
            )
            .filter(status=BusinessStatusChoices.ACTIVE)
        )


class SchemePeriod(BaseModel):
    """
    Tracks each period/renewal of a scheme.

    Each scheme can have multiple periods representing renewals.
    This model preserves complete historical data without overwriting.
    """

    scheme = models.ForeignKey(
        "schemes.Scheme",
        on_delete=models.CASCADE,
        related_name="periods",
        help_text="Parent scheme this period belongs to.",
    )
    period_number = models.PositiveIntegerField(
        help_text="Sequential period number (1 for initial, 2+ for renewals)."
    )
    start_date = models.DateField(help_text="Period start date.")
    end_date = models.DateField(help_text="Period end date.")
    termination_date = models.DateField(
        null=True,
        blank=True,
        help_text="Actual termination date (may differ from end_date).",
    )

    # Coverage details
    limit_amount = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        validators=[MinValueValidator(Decimal("0.01"))],
        help_text="Coverage or limit amount for this period.",
    )

    # Renewal tracking
    renewed_from = models.ForeignKey(
        "self",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="renewed_to",
        help_text="Previous period this was renewed from.",
    )
    renewal_date = models.DateField(
        null=True,
        blank=True,
        help_text="Date when this renewal was created.",
    )
    is_current = models.BooleanField(
        default=True,
        db_index=True,
        help_text="Is this the current active period for the scheme?",
    )

    # Change tracking
    changes_summary = models.JSONField(
        default=dict,
        blank=True,
        help_text="Summary of changes from previous period (JSON).",
    )
    remark = models.TextField(max_length=500, blank=True, help_text="Period remarks.")

    objects = SchemePeriodManager()
    all_objects = models.Manager()

    class Meta:
        verbose_name = "Scheme Period"
        verbose_name_plural = "Scheme Periods"
        db_table = "scheme_periods"
        unique_together = [("scheme", "period_number")]
        ordering = ["-period_number"]
        indexes = [
            models.Index(fields=["scheme", "is_current"]),
            models.Index(fields=["start_date", "end_date"]),
            models.Index(fields=["scheme", "period_number"]),
            models.Index(fields=["renewed_from"]),
        ]
        constraints = [
            models.UniqueConstraint(
                fields=["scheme"],
                condition=models.Q(is_current=True, is_deleted=False),
                name="unique_current_period_per_scheme",
            )
        ]

    def clean(self):
        """Validate period data."""
        errors = {}

        # Date validation
        if self.start_date and self.end_date and self.start_date >= self.end_date:
            errors["end_date"] = "End date must be after start date."

        if (
            self.termination_date
            and self.end_date
            and self.termination_date <= self.end_date
        ):
            errors["termination_date"] = "Termination date must be after end date."

        # Period number validation
        if self.period_number and self.period_number < 1:
            errors["period_number"] = "Period number must be at least 1."

        # Renewal validation
        if self.period_number and self.period_number > 1 and not self.renewed_from:
            errors["renewed_from"] = (
                "Renewal periods (period_number > 1) must reference previous period."
            )

        # Ensure only one current period per scheme
        if self.is_current and self.scheme_id:
            existing_current = SchemePeriod.objects.filter(
                scheme_id=self.scheme_id,
                is_current=True,
                is_deleted=False
            ).exclude(id=self.id if self.id else None)

            if existing_current.exists():
                current_period = existing_current.first()
                errors["is_current"] = (
                    f"Another period (Period {current_period.period_number}) is already marked as current for this scheme. "
                    "Mark the previous period as non-current first."
                )

        if errors:
            raise ValidationError(errors)

    def save(self, *args, **kwargs):
        """Save with validation and auto-set termination date."""
        # Auto-calculate termination_date if not set
        if self.end_date and not self.termination_date:
            if isinstance(self.end_date, str):
                from datetime import datetime

                end_date = datetime.strptime(self.end_date, "%Y-%m-%d").date()
            else:
                end_date = self.end_date
            self.termination_date = end_date + timedelta(days=1)

        self.full_clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.scheme.scheme_name} - Period {self.period_number}"

    # Domain methods
    def is_active_on(self, when_date) -> bool:
        """Check if period is active on a specific date."""
        if self.status != BusinessStatusChoices.ACTIVE:
            return False
        if self.start_date and when_date < self.start_date:
            return False
        return not (self.termination_date and when_date >= self.termination_date)

    def terminate(self, *, reason: str | None = None, user=None):
        """Terminate this period and mark as inactive."""
        self.status = BusinessStatusChoices.INACTIVE
        self.is_current = False

        if not self.termination_date and self.end_date:
            if isinstance(self.end_date, str):
                from datetime import datetime

                end_date = datetime.strptime(self.end_date, "%Y-%m-%d").date()
            else:
                end_date = self.end_date
            self.termination_date = end_date + timedelta(days=1)

        if reason and self.remark:
            self.remark = f"{self.remark}\nTerminated: {reason}"
        elif reason:
            self.remark = f"Terminated: {reason}"

        self.save(update_fields=["status", "is_current", "termination_date", "remark", "updated_at"])

    def calculate_changes_from(self, previous_period: "SchemePeriod") -> dict:
        """
        Calculate what changed between this period and previous.

        Returns:
            dict: Summary of changes
        """
        changes = {}

        if previous_period.limit_amount != self.limit_amount:
            changes["limit_amount"] = {
                "from": str(previous_period.limit_amount),
                "to": str(self.limit_amount),
            }

        if previous_period.start_date != self.start_date:
            changes["start_date"] = {
                "from": previous_period.start_date.isoformat(),
                "to": self.start_date.isoformat(),
            }

        if previous_period.end_date != self.end_date:
            changes["end_date"] = {
                "from": previous_period.end_date.isoformat(),
                "to": self.end_date.isoformat(),
            }

        return changes

    def compare_with(self, other_period: "SchemePeriod") -> dict:
        """
        Compare this period with another period.

        Provides detailed comparison metrics including limit changes,
        duration differences, and period gaps.

        Args:
            other_period: Another SchemePeriod to compare with

        Returns:
            dict: Comparison details including:
                - period_difference: Difference in period numbers
                - limit_change: Absolute change in limit amount
                - limit_change_percent: Percentage change in limit
                - duration_days_1: Duration of first period
                - duration_days_2: Duration of second period
                - gap_days: Days between periods (negative if overlap)
                - scheme_name: Name of the scheme

        Example:
            >>> period1 = scheme.periods.get(period_number=1)
            >>> period2 = scheme.periods.get(period_number=2)
            >>> comparison = period1.compare_with(period2)
            >>> print(f"Limit increased by {comparison['limit_change_percent']}%")
        """
        from decimal import Decimal

        # Calculate limit changes
        limit_change = float(other_period.limit_amount - self.limit_amount)
        limit_change_percent = (
            float(((other_period.limit_amount - self.limit_amount) / self.limit_amount) * 100)
            if self.limit_amount > 0
            else 0
        )

        # Calculate durations
        duration_1 = (self.end_date - self.start_date).days + 1
        duration_2 = (other_period.end_date - other_period.start_date).days + 1

        # Calculate gap (negative means overlap)
        gap_days = (other_period.start_date - self.end_date).days - 1

        return {
            "period_difference": other_period.period_number - self.period_number,
            "limit_change": limit_change,
            "limit_change_percent": round(limit_change_percent, 2),
            "duration_days_1": duration_1,
            "duration_days_2": duration_2,
            "duration_change": duration_2 - duration_1,
            "gap_days": gap_days,
            "has_gap": gap_days > 0,
            "has_overlap": gap_days < 0,
            "scheme_name": self.scheme.scheme_name,
            "period_1_number": self.period_number,
            "period_2_number": other_period.period_number,
        }
