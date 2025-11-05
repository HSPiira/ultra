"""
Validation rule classes for extensible validation.

Provides pluggable validation rules that can be composed together,
addressing Open/Closed Principle (OCP) violations.
"""
from typing import Dict, Any, List, Optional
from django.core.exceptions import ValidationError

from apps.core.exceptions.service_errors import (
    RequiredFieldError,
    InvalidFormatError,
    InvalidValueError,
)
from apps.core.services.interfaces import IValidationRule
from apps.core.utils.validation import (
    validate_email_format,
    validate_string_length,
    validate_date_range,
)


class RequiredFieldsRule(IValidationRule):
    """Validation rule for required fields."""
    
    def __init__(self, fields: List[str], entity_name: str = "Entity"):
        """
        Initialize required fields rule.
        
        Args:
            fields: List of required field names
            entity_name: Name of entity for error messages
        """
        self.fields = fields
        self.entity_name = entity_name
    
    def validate(self, data: Dict[str, Any], entity=None) -> None:
        """Validate that all required fields are present."""
        for field in self.fields:
            value = data.get(field)
            if value is None or value == "" or value == [] or value == {}:
                raise RequiredFieldError(field)


class EmailFormatRule(IValidationRule):
    """Validation rule for email format."""
    
    def __init__(self, field: str = "email"):
        """
        Initialize email format rule.
        
        Args:
            field: Name of email field
        """
        self.field = field
    
    def validate(self, data: Dict[str, Any], entity=None) -> None:
        """Validate email format."""
        if self.field in data:
            validate_email_format(data[self.field], self.field)


class StringLengthRule(IValidationRule):
    """Validation rule for string length."""
    
    def __init__(
        self,
        field: str,
        min_length: Optional[int] = None,
        max_length: Optional[int] = None
    ):
        """
        Initialize string length rule.
        
        Args:
            field: Name of field to validate
            min_length: Minimum length
            max_length: Maximum length
        """
        self.field = field
        self.min_length = min_length
        self.max_length = max_length
    
    def validate(self, data: Dict[str, Any], entity=None) -> None:
        """Validate string length."""
        if self.field in data:
            validate_string_length(
                data[self.field],
                self.field,
                min_length=self.min_length,
                max_length=self.max_length
            )


class DateRangeRule(IValidationRule):
    """Validation rule for date ranges."""
    
    def __init__(self, start_field: str, end_field: str):
        """
        Initialize date range rule.
        
        Args:
            start_field: Name of start date field
            end_field: Name of end date field
        """
        self.start_field = start_field
        self.end_field = end_field
    
    def validate(self, data: Dict[str, Any], entity=None) -> None:
        """Validate date range."""
        start_date = data.get(self.start_field)
        end_date = data.get(self.end_field)
        
        # For updates, use existing entity values if not in data
        if entity:
            start_date = start_date or getattr(entity, self.start_field, None)
            end_date = end_date or getattr(entity, self.end_field, None)
        
        if start_date and end_date:
            validate_date_range(
                start_date,
                end_date,
                self.start_field,
                self.end_field
            )


class ValidationRuleSet:
    """
    Composable set of validation rules.
    
    Allows multiple validation rules to be applied together.
    """
    
    def __init__(self, rules: List[IValidationRule]):
        """
        Initialize validation rule set.
        
        Args:
            rules: List of validation rules to apply
        """
        self.rules = rules
    
    def validate(self, data: Dict[str, Any], entity=None) -> None:
        """
        Validate data using all rules.
        
        Args:
            data: Dictionary containing data to validate
            entity: Optional existing entity (for update operations)
        """
        for rule in self.rules:
            rule.validate(data, entity)

