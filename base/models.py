from datetime import timedelta
from django.db import models
from cuid2 import Cuid
from django.forms import ValidationError

def generate_cuid() -> str:
    return Cuid().generate()

class BaseModel(models.Model):
    """
    Abstract base model with common fields.
    """
    id = models.CharField(primary_key= True, max_length=25, default=generate_cuid, editable=False)
    created_at = models.DateTimeField(auto_now_add=True, help_text="Time when this record was created.")
    updated_at = models.DateTimeField(auto_now=True, help_text="Time when this record was last updated.")
    is_active = models.BooleanField(default=True, help_text="Soft delete flag or status marker.")

    class Meta:
        abstract = True
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.__class__.__name__}({self.id})"
    
class StatusChoices(models.TextChoices):
    ACTIVE = 'ACTIVE', 'Active'
    INACTIVE = 'INACTIVE', 'Inactive'
    SUSPENDED = 'SUSPENDED', 'Suspended'
    DELETED = 'DELETED', 'Deleted'

class CompanyType(BaseModel):
    """
    Model representing different types of companies.
    """
    type_name = models.CharField(max_length=100, unique=True, help_text="Name of the company type.")
    description = models.TextField(max_length=500, blank=True, help_text="Description of the company type.")
    status = models.CharField(max_length=10, choices=StatusChoices.choices, default=StatusChoices.ACTIVE, help_text="Status of the company type.")

    class Meta:
        verbose_name = "Company Type"
        verbose_name_plural = "Company Types"
        db_table = "nm_company_types"
    def __str__(self):
        return self.type_name
    
class Company(BaseModel):
    """
    Model representing a company.
    """
    company_name = models.CharField(max_length=255, help_text="Name of the company.")
    contact_person = models.CharField(max_length=255, help_text="Contact person for the company.")
    company_address = models.TextField(help_text="Address of the company.")
    phone_number = models.CharField(max_length=20, help_text="Phone number of the company.")
    email = models.EmailField(max_length=255, help_text="Email address of the company.")
    website = models.URLField(max_length=255, blank=True, help_text="Website of the company.")
    company_type = models.ForeignKey(CompanyType, on_delete=models.CASCADE, related_name="companies", help_text="Type of the company.")
    status = models.CharField(max_length=10, choices=StatusChoices.choices, default=StatusChoices.ACTIVE, help_text="Status of the company.")
    remark = models.TextField(max_length=500, blank=True, help_text="Additional remarks about the company.")
    class Meta:
        verbose_name = "Company"
        verbose_name_plural = "Companies"
        db_table = "nm_companies"
    
    def __str__(self):
        return self.company_name
    
class Scheme(BaseModel):
    """
    Model representing a scheme.
    """
    scheme_name = models.CharField(max_length=255, help_text="Name of the scheme.")
    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name="schemes", help_text="Company associated with the scheme.")
    card_code = models.CharField(max_length=3, unique=True, help_text="Unique code for the scheme.")
    description = models.TextField(max_length=500, blank=True, help_text="Description of the scheme.")
    start_date = models.DateField(help_text="Start date of the scheme.")
    end_date = models.DateField(help_text="End date of the scheme.")
    termination_date = models.DateField(null=True, blank=True, help_text="Termination date of the scheme, if applicable.")
    limit_amount = models.DecimalField(max_digits=15, decimal_places=2, help_text="Limit amount for the scheme.")
    family_status = models.BooleanField(default=False, choices=[(True, 'Applicable'), (False, 'Not Applicable')], help_text="Indicates if the scheme is applicable for family.")
    status = models.CharField(max_length=10, choices=StatusChoices.choices, default=StatusChoices.ACTIVE, help_text="Status of the scheme.")
    remark = models.TextField(max_length=500, blank=True, help_text="Additional remarks about the scheme.")

    class Meta:
        verbose_name = "Scheme"
        verbose_name_plural = "Schemes"
        db_table = "nm_schemes"

    def save(self, *args, **kwargs):
        if self.end_date and not self.termination_date:
            self.termination_date = self.end_date + timedelta(days=1)
        super().save(*args, **kwargs)

    def clean(self):
        errors = {}
        if self.start_date and self.end_date and self.start_date >= self.end_date:
            errors['end_date'] = "End date must be after the start date."
            
        if self.termination_date and self.termination_date <= self.ending_date:
            errors['termination_date'] = "Termination date must be after the end date."

        if self.limit_amount is not None and self.limit_amount <= 0:
            errors['limit_amount'] = "Limit amount cannot be less than 0."

        if errors:
            raise ValidationError(errors)
    
    def __str__(self):
        return self.scheme_name