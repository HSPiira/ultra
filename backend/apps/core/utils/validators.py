"""
Custom validators for data integrity.
"""
import re
from django.core.exceptions import ValidationError
from django.core.validators import RegexValidator


# ---------------------------------------------------------------------
# Phone Number Validation
# ---------------------------------------------------------------------
def normalize_phone_number(phone_number: str) -> str:
    """
    Normalize phone number to E.164 format.

    - Removes spaces, dashes, parentheses
    - Ensures + prefix for international format
    - Returns normalized format: +[country_code][number]

    Examples:
        '+256 207 123 4567' -> '+2562071234567'
        '234-567-8900' -> '+12345678900' (assumes Uganda if no country code)
        '+256 72 123 4567' -> '+256721234567'
    """
    if not phone_number:
        return phone_number

    # Remove all non-digit characters except +
    cleaned = re.sub(r'[^\d+]', '', phone_number)

    # Ensure + prefix exists
    if not cleaned.startswith('+'):
        # Default to +256 (Uganda) if no country code provided
        # For international use, you may want to make this configurable
        cleaned = '+256' + cleaned

    return cleaned


def validate_phone_number(phone_number: str) -> str:
    """
    Validate and normalize phone number.

    Requirements:
    - Must be in format: +[country_code][number]
    - Country code: 1-3 digits
    - Total length: 10-15 digits (excluding +)
    - Only digits after country code

    Returns normalized phone number.
    Raises ValidationError if invalid.
    """
    if not phone_number:
        return phone_number

    # Normalize first
    normalized = normalize_phone_number(phone_number)

    # Validate format: +[1-3 digit country code][7-14 digit number]
    pattern = r'^\+\d{1,3}\d{7,14}$'
    if not re.match(pattern, normalized):
        raise ValidationError(
            f"Phone number must be in format +[country code][number] "
            f"with 1-3 digit country code and 7-14 digit number. "
            f"Example: +2562071234567 or +256721234567"
        )

    # Additional validation: minimum total length (country code + number)
    if len(normalized) < 11:  # + sign + minimum 10 digits
        raise ValidationError(
            "Phone number too short. Must have at least 10 digits including country code."
        )

    if len(normalized) > 16:  # + sign + maximum 15 digits
        raise ValidationError(
            "Phone number too long. Maximum 15 digits including country code."
        )

    return normalized


class PhoneNumberValidator(RegexValidator):
    """
    Django validator for phone numbers.

    Usage:
        phone = models.CharField(
            validators=[PhoneNumberValidator()],
            max_length=20
        )
    """
    regex = r'^\+\d{1,3}\d{7,14}$'
    message = (
        "Phone number must be in format +[country code][number]. "
        "Example: +2562071234567 or +256721234567"
    )
    code = 'invalid_phone_number'


# ---------------------------------------------------------------------
# Card Code Validation
# ---------------------------------------------------------------------
def normalize_card_code(card_code: str) -> str:
    """
    Normalize card code to uppercase alphanumeric format.

    - Converts to uppercase
    - Removes spaces and special characters
    - Returns normalized format

    Examples:
        'abc' -> 'ABC'
        'a-b-c' -> 'ABC'
        'TST' -> 'TST'
    """
    if not card_code:
        return card_code

    # Remove non-alphanumeric characters and convert to uppercase
    normalized = re.sub(r'[^A-Za-z0-9]', '', card_code).upper()

    return normalized


def validate_card_code(card_code: str) -> str:
    """
    Validate and normalize card code.

    Requirements:
    - Exactly 3 characters
    - Alphanumeric only (A-Z, 0-9)
    - Case-insensitive (normalized to uppercase)

    Returns normalized card code.
    Raises ValidationError if invalid.
    """
    if not card_code:
        raise ValidationError("Card code is required.")

    # Normalize first
    normalized = normalize_card_code(card_code)

    # Check length
    if len(normalized) != 3:
        raise ValidationError(
            f"Card code must be exactly 3 alphanumeric characters. Got: '{card_code}'"
        )

    # Validate alphanumeric
    if not normalized.isalnum():
        raise ValidationError(
            "Card code must contain only letters (A-Z) and numbers (0-9)."
        )

    return normalized


class CardCodeValidator(RegexValidator):
    """
    Django validator for card codes.

    Usage:
        card_code = models.CharField(
            validators=[CardCodeValidator()],
            max_length=3
        )
    """
    regex = r'^[A-Z0-9]{3}$'
    message = "Card code must be exactly 3 alphanumeric characters (A-Z, 0-9)."
    code = 'invalid_card_code'
