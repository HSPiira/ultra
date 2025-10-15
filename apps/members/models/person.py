from django.db import models
from django.core.validators import RegexValidator
from django.core.exceptions import ValidationError
from apps.core.models.base import BaseModel
from apps.core.enums.choices import GenderChoices, RelationshipChoices
from apps.companies.models import Company
from apps.schemes.models import Scheme

class Person(BaseModel):
    company = models.ForeignKey(
        Company, 
        on_delete=models.CASCADE,
        help_text="Associated company"
    )
    scheme = models.ForeignKey(
        Scheme, 
        on_delete=models.CASCADE,
        help_text="Insurance scheme"
    )
    name = models.CharField(
        max_length=200,
        help_text="Full name of the person"
    )
    
    national_id = models.CharField(
        max_length=25, 
        blank=True,
        validators=[RegexValidator(
            regex=r'^[A-Z0-9]+$',
            message='National ID must contain only uppercase letters and numbers'
        )]
    )
    
    gender = models.CharField(
        max_length=10, 
        choices=GenderChoices.choices,
        db_index=True
    )
    
    relationship = models.CharField(
        max_length=20, 
        choices=RelationshipChoices.choices,
        default=RelationshipChoices.SELF,
        db_index=True
    )
    
    parent = models.ForeignKey(
        'self', 
        null=True, 
        blank=True, 
        related_name='dependants', 
        on_delete=models.CASCADE
    )
    
    date_of_birth = models.DateField(
        null=True, 
        blank=True,
        db_index=True
    )
    
    card_number = models.CharField(
        max_length=15, 
        validators=[RegexValidator(
            regex=r'^[A-Z0-9-]+$',
            message='Card number must contain only uppercase letters, numbers and hyphens'
        )]
    )
    
    address = models.TextField(blank=True)
    
    phone_number = models.CharField(
        max_length=50, 
        blank=True,
        validators=[RegexValidator(
            regex=r'^\+?1?\d{9,15}$',
            message='Phone number must be in format: +999999999'
        )]
    )
    
    email = models.EmailField(blank=True)

    class Meta:
        indexes = [
            models.Index(fields=['company', 'scheme']),
            models.Index(fields=['company', 'card_number']),
            models.Index(fields=['date_of_birth', 'relationship']),
        ]
        ordering = ['-created_at']
        constraints = [
            models.UniqueConstraint(fields=['company', 'card_number'], name='uniq_company_card_number')
        ]
        
    def __str__(self):
        return f"{self.name} ({self.card_number})"
        
    def get_age(self):
        """Calculate person's age."""
        if self.date_of_birth:
            from datetime import date
            today = date.today()
            return today.year - self.date_of_birth.year - (
                (today.month, today.day) < 
                (self.date_of_birth.month, self.date_of_birth.day)
            )
        return None

    def clean(self):
        # Relationship logic: dependants must have a valid parent in same company & scheme and parent must be SELF
        from apps.core.enums.choices import RelationshipChoices
        errors = {}
        if self.relationship != RelationshipChoices.SELF:
            if not self.parent:
                errors['parent'] = 'Dependants must reference a parent member.'
            else:
                if self.parent.company_id != self.company_id or self.parent.scheme_id != self.scheme_id:
                    errors['parent'] = 'Parent must belong to the same company and scheme.'
                if self.parent.relationship != RelationshipChoices.SELF:
                    errors['parent'] = 'Parent must have relationship SELF.'

        # Global card uniqueness (optional): enforce globally unique card_number if business requires
        # If you want global uniqueness uncomment below and add a DB UniqueConstraint migration
        # if Person.all_objects.filter(card_number=self.card_number).exclude(pk=self.pk).exists():
        #     errors['card_number'] = 'Card number must be unique system-wide.'

        if errors:
            raise ValidationError(errors)