from datetime import timedelta
from django.db import models
from django.utils import timezone
from django.core.validators import RegexValidator, MinValueValidator
from django.forms import ValidationError
from cuid2 import Cuid


# ---------------------------------------------------------------------
# Helper: Generate CUID for unique identifiers
# ---------------------------------------------------------------------
def generate_cuid() -> str:
    return Cuid().generate()


# ---------------------------------------------------------------------
# Enums
# ---------------------------------------------------------------------
class BusinessStatusChoices(models.TextChoices):
    ACTIVE = "ACTIVE", "Active"
    INACTIVE = "INACTIVE", "Inactive"
    SUSPENDED = "SUSPENDED", "Suspended"


# ---------------------------------------------------------------------
# Custom Manager for Soft Delete
# ---------------------------------------------------------------------
class ActiveManager(models.Manager):
    """Default manager that excludes deleted records."""

    def get_queryset(self):
        return super().get_queryset().filter(is_deleted=False)


# ---------------------------------------------------------------------
# Base Model with Soft Delete + Business Status
# ---------------------------------------------------------------------
class BaseModel(models.Model):
    """
    Abstract base model providing:
    - Unique CUID-based primary key
    - Created/updated timestamps
    - Business status
    - Soft delete capability (is_deleted, deleted_at, deleted_by)
    """

    id = models.CharField(
        primary_key=True, max_length=25, default=generate_cuid, editable=False
    )
    created_at = models.DateTimeField(auto_now_add=True, help_text="When record was created.")
    updated_at = models.DateTimeField(auto_now=True, help_text="When record was last updated.")
    status = models.CharField(
        max_length=10,
        choices=BusinessStatusChoices.choices,
        default=BusinessStatusChoices.ACTIVE,
        help_text="Business or operational status of this record.",
    )

    # Soft delete lifecycle fields
    is_deleted = models.BooleanField(default=False, help_text="Indicates if record is soft deleted.")
    deleted_at = models.DateTimeField(null=True, blank=True, help_text="When record was soft deleted.")
    deleted_by = models.ForeignKey(
        "auth.User", null=True, blank=True, on_delete=models.SET_NULL, help_text="User who deleted the record."
    )

    # Managers
    objects = ActiveManager()        # Default manager filters out deleted
    all_objects = models.Manager()   # Includes everything

    class Meta:
        abstract = True
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.__class__.__name__}({self.id})"

    # -----------------------------------------------------------------
    # Lifecycle helpers
    # -----------------------------------------------------------------
    def soft_delete(self, user=None):
        """Marks the record as deleted without removing it from the DB."""
        if not self.is_deleted:
            self.is_deleted = True
            self.deleted_at = timezone.now()
            if user:
                self.deleted_by = user
            self.save(update_fields=["is_deleted", "deleted_at", "deleted_by"])

    def restore(self):
        """Restores a previously soft-deleted record."""
        if self.is_deleted:
            self.is_deleted = False
            self.deleted_at = None
            self.deleted_by = None
            self.save(update_fields=["is_deleted", "deleted_at", "deleted_by"])

    def delete(self, *args, **kwargs):
        """Override default delete to always soft delete."""
        self.soft_delete()


# ---------------------------------------------------------------------
# Industry
# ---------------------------------------------------------------------
class Industry(BaseModel):
    industry_name = models.CharField(max_length=100, unique=True, help_text="Type name.")
    description = models.TextField(max_length=500, blank=True, help_text="Description of the company type.")

    class Meta:
        verbose_name = "Industry"
        verbose_name_plural = "Industries"
        db_table = "nm_industries"

    def __str__(self):
        return self.industry_name


# ---------------------------------------------------------------------
# Company
# ---------------------------------------------------------------------
class Company(BaseModel):
    company_name = models.CharField(max_length=255, help_text="Registered company name.")
    contact_person = models.CharField(max_length=255, help_text="Contact person name.")
    company_address = models.TextField(help_text="Company address.")
    phone_number = models.CharField(
        max_length=20,
        validators=[
            RegexValidator(
                regex=r"^\+?1?\d{9,15}$",
                message="Phone number must be entered in the format: '+999999999'. Up to 15 digits allowed.",
            )
        ],
        help_text="Primary phone number.",
    )
    email = models.EmailField(max_length=255, help_text="Company email.")
    website = models.URLField(max_length=255, blank=True, null=True, help_text="Company website.")
    industry = models.ForeignKey(
        Industry,
        on_delete=models.CASCADE,
        related_name="companies",
        help_text="Industry reference.",
    )
    remark = models.TextField(max_length=500, blank=True, help_text="Remarks about this company.")

    class Meta:
        verbose_name = "Company"
        verbose_name_plural = "Companies"
        db_table = "nm_companies"

    def __str__(self):
        return self.company_name


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
