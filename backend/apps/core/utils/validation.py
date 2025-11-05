"""
Validation utilities for service layer.

Provides reusable validation functions to eliminate code duplication
across service classes.
"""
from apps.core.exceptions.service_errors import (
    RequiredFieldError,
    InvalidFormatError,
    InvalidValueError,
)


def validate_required_fields(data: dict, fields: list, entity_name: str = "Entity"):
    """
    Validate that all required fields are present and non-empty.
    
    Args:
        data: Dictionary containing the data to validate
        fields: List of required field names
        entity_name: Name of the entity for error messages (unused but kept for API consistency)
        
    Raises:
        RequiredFieldError: If any required field is missing or empty
    """
    for field in fields:
        value = data.get(field)
        # Check for None, empty string, empty list, empty dict
        if value is None or value == "" or value == [] or value == {}:
            raise RequiredFieldError(field)


def validate_string_length(value: str, field: str, min_length: int = None, max_length: int = None, allow_none: bool = False):
    """
    Validate string length constraints.
    
    Args:
        value: String value to validate
        field: Field name for error messages
        min_length: Minimum length (inclusive)
        max_length: Maximum length (inclusive)
        allow_none: Whether None is allowed
        
    Raises:
        InvalidValueError: If validation fails
    """
    if value is None:
        if not allow_none:
            raise RequiredFieldError(field)
        return
    
    if not isinstance(value, str):
        raise InvalidValueError(field, f"{field} must be a string")
    
    value = value.strip()
    
    if min_length is not None and len(value) < min_length:
        raise InvalidValueError(
            field,
            f"{field} must be at least {min_length} characters long"
        )
    
    if max_length is not None and len(value) > max_length:
        raise InvalidValueError(
            field,
            f"{field} cannot exceed {max_length} characters"
        )


def validate_email_format(email: str, field: str = "email"):
    """
    Validate email format (basic check).
    
    Note: Full validation is handled by Django's EmailValidator in models.
    This provides a basic format check before database operations.
    
    Args:
        email: Email address to validate
        field: Field name for error messages
        
    Raises:
        InvalidFormatError: If email format is invalid
    """
    if not email or not isinstance(email, str):
        return
    
    if "@" not in email or "." not in email.split("@")[-1]:
        raise InvalidFormatError(field, "Invalid email format")


def validate_positive_amount(value, field: str, allow_none: bool = False, allow_zero: bool = False):
    """
    Validate that a numeric value is positive.
    
    Args:
        value: Numeric value to validate
        field: Field name for error messages
        allow_none: Whether None is allowed
        allow_zero: Whether zero is allowed
        
    Raises:
        InvalidValueError: If value is not positive
    """
    if value is None:
        if not allow_none:
            raise RequiredFieldError(field)
        return
    
    try:
        numeric_value = float(value)
    except (ValueError, TypeError):
        raise InvalidValueError(field, f"{field} must be a number")
    
    if not allow_zero and numeric_value <= 0:
        raise InvalidValueError(field, f"{field} must be greater than zero")
    elif allow_zero and numeric_value < 0:
        raise InvalidValueError(field, f"{field} must be greater than or equal to zero")


def validate_date_range(start_date, end_date, start_field: str = "start_date", end_field: str = "end_date"):
    """
    Validate that end_date is after start_date.
    
    Args:
        start_date: Start date value
        end_date: End date value
        start_field: Field name for start date (error messages)
        end_field: Field name for end date (error messages)
        
    Raises:
        InvalidValueError: If date range is invalid
    """
    if not start_date or not end_date:
        return  # Let required field validation handle missing dates
    
    if end_date <= start_date:
        # Use capitalized field names for better error messages
        end_field_display = end_field.replace('_', ' ').title()
        start_field_display = start_field.replace('_', ' ').title()
        raise InvalidValueError(
            end_field,
            f"{end_field_display} must be after {start_field_display}"
        )


def validate_choice_value(value, choices, field: str, allow_none: bool = False):
    """
    Validate that a value is one of the allowed choices.
    
    Args:
        value: Value to validate
        choices: Iterable of allowed values or Django choices tuple
        field: Field name for error messages
        allow_none: Whether None is allowed
        
    Raises:
        InvalidValueError: If value is not in choices
    """
    if value is None:
        if not allow_none:
            raise RequiredFieldError(field)
        return
    
    # Handle Django choices format (list of tuples)
    if choices and isinstance(choices[0], (tuple, list)):
        allowed_values = [choice[0] for choice in choices]
    else:
        allowed_values = list(choices)
    
    if value not in allowed_values:
        allowed_str = ", ".join(str(v) for v in allowed_values)
        raise InvalidValueError(
            field,
            f"{field} must be one of: {allowed_str}"
        )


def validate_percentage(value, field: str, min_value: float = 0.0, max_value: float = 100.0, allow_none: bool = False):
    """
    Validate that a value is a valid percentage (0-100).
    
    Args:
        value: Percentage value to validate
        field: Field name for error messages
        min_value: Minimum allowed percentage
        max_value: Maximum allowed percentage
        allow_none: Whether None is allowed
        
    Raises:
        InvalidValueError: If percentage is out of range
    """
    if value is None:
        if not allow_none:
            raise RequiredFieldError(field)
        return
    
    try:
        numeric_value = float(value)
    except (ValueError, TypeError):
        raise InvalidValueError(field, f"{field} must be a number")
    
    if numeric_value < min_value or numeric_value > max_value:
        raise InvalidValueError(
            field,
            f"{field} must be between {min_value} and {max_value}"
        )

