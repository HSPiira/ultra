from django.core.exceptions import ValidationError
from django.core.validators import RegexValidator
from django.db import models

from apps.companies.models.industry import Industry
from apps.core.models.base import BaseModel, ActiveManager


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
        validators=[
            RegexValidator(
                regex=r"^\+?1?\d{9,15}$",
                message="Phone number must be entered in the format: '+999999999'. Up to 15 digits allowed.",
            )
        ],
        help_text="Primary phone number.",
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

    def soft_delete(self, user=None):
        """Prevent deletion when related members or schemes exist."""
        if Company.objects.has_members(self.id) or Company.objects.has_schemes(self.id):
            raise ValidationError(
                "Cannot delete company with existing members or schemes."
            )
        super().soft_delete(user=user)
