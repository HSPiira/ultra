from django.db import models
from django.core.validators import RegexValidator
from apps.core.models.base import BaseModel
from apps.companies.models.industry import Industry

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
        db_table = "companies"

    def __str__(self):
        return self.company_name