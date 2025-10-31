from django.core.exceptions import ValidationError
from django.db import models

from apps.companies.models.industry import Industry
from apps.core.models.base import BaseModel, ActiveManager
from apps.core.utils.validators import PhoneNumberValidator, validate_phone_number


# ---------------------------------------------------------------------
# Managers
# ---------------------------------------------------------------------
class CompanyManager(ActiveManager):
    def get_by_name(self, company_name: str):
        return self.filter(company_name__iexact=company_name).first()

    def has_members(self, company_id: str) -> bool:
        from apps.members.models import Person

        return Person.objects.filter(company_id=company_id).exists()

    def has_schemes(self, company_id: str) -> bool:
        from apps.schemes.models import Scheme

        return Scheme.objects.filter(company_id=company_id).exists()


# ---------------------------------------------------------------------
# Company
# ---------------------------------------------------------------------
class Company(BaseModel):
    company_name = models.CharField(
        max_length=255, unique=True, help_text="Registered company name."
    )
    contact_person = models.CharField(max_length=255, help_text="Contact person name.")
    company_address = models.TextField(help_text="Company address.")
    phone_number = models.CharField(
        max_length=20,
        validators=[PhoneNumberValidator()],
        help_text="Primary phone number in format: +[country code][number] (e.g., +12345678900).",
    )
    email = models.EmailField(max_length=255, help_text="Company email.")
    website = models.URLField(
        max_length=255, blank=True, null=True, help_text="Company website."
    )
    industry = models.ForeignKey(
        Industry,
        on_delete=models.CASCADE,
        related_name="companies",
        help_text="Industry reference.",
    )
    remark = models.TextField(
        max_length=500, blank=True, help_text="Remarks about this company."
    )

    class Meta:
        verbose_name = "Company"
        verbose_name_plural = "Companies"
        db_table = "companies"

    def __str__(self):
        return self.company_name

    # Managers
    objects = CompanyManager()

    def clean(self):
        """Validate and normalize data before saving."""
        super().clean()
        # Normalize phone number to E.164 format
        if self.phone_number:
            self.phone_number = validate_phone_number(self.phone_number)

    def save(self, *args, **kwargs):
        """Override save to ensure validation runs."""
        self.full_clean()
        super().save(*args, **kwargs)

    def soft_delete(self, user=None):
        """Prevent deletion when related members or schemes exist."""
        if Company.objects.has_members(self.id) or Company.objects.has_schemes(self.id):
            raise ValidationError(
                "Cannot delete company with existing members or schemes."
            )
        super().soft_delete(user=user)
