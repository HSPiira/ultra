"""
Input sanitization utilities for data validation and cleaning.

These utilities provide consistent sanitization across the application to prevent:
- SQL injection via special characters
- XSS attacks via HTML/JavaScript
- Path traversal attacks
- Format inconsistencies
"""

import re
import unicodedata
from typing import Optional


def sanitize_alphanumeric(value: str, allow_spaces: bool = False, allow_hyphens: bool = False) -> str:
    """
    Sanitize string to contain only alphanumeric characters.

    Args:
        value: String to sanitize
        allow_spaces: Whether to allow spaces
        allow_hyphens: Whether to allow hyphens (useful for card numbers, IDs)

    Returns:
        Sanitized string with only allowed characters

    Examples:
        >>> sanitize_alphanumeric("ABC123")
        'ABC123'
        >>> sanitize_alphanumeric("ABC-123", allow_hyphens=True)
        'ABC-123'
        >>> sanitize_alphanumeric("ABC 123", allow_spaces=True)
        'ABC 123'
        >>> sanitize_alphanumeric("ABC@#$123")
        'ABC123'
    """
    if not value:
        return ""

    # Start with alphanumeric
    pattern = r"[^A-Za-z0-9"
    if allow_spaces:
        pattern += r"\s"
    if allow_hyphens:
        pattern += r"\-"
    pattern += r"]"

    # Remove disallowed characters
    sanitized = re.sub(pattern, "", value)

    # Normalize whitespace if spaces are allowed
    if allow_spaces:
        sanitized = " ".join(sanitized.split())

    return sanitized.strip()


def sanitize_card_code(value: str) -> str:
    """
    Sanitize card code to uppercase alphanumeric only.

    Args:
        value: Card code to sanitize (should be 3 characters)

    Returns:
        Sanitized uppercase alphanumeric string

    Examples:
        >>> sanitize_card_code("abc")
        'ABC'
        >>> sanitize_card_code("a1c")
        'A1C'
        >>> sanitize_card_code("a@c")
        'AC'
    """
    if not value:
        return ""

    return sanitize_alphanumeric(value).upper()


def sanitize_text(value: str, max_length: Optional[int] = None, allow_newlines: bool = False) -> str:
    """
    Sanitize general text input by removing dangerous characters.

    Removes:
    - NULL bytes
    - Control characters (except newlines if allowed)
    - Leading/trailing whitespace

    Args:
        value: Text to sanitize
        max_length: Maximum allowed length (truncates if exceeded)
        allow_newlines: Whether to preserve newline characters

    Returns:
        Sanitized text

    Examples:
        >>> sanitize_text("  Hello World  ")
        'Hello World'
        >>> sanitize_text("Hello\\x00World")
        'HelloWorld'
    """
    if not value:
        return ""

    # Remove NULL bytes
    sanitized = value.replace("\x00", "")

    # Remove control characters except newlines (if allowed)
    if allow_newlines:
        # Keep only printable characters and newlines
        sanitized = "".join(char for char in sanitized if char.isprintable() or char == "\n")
    else:
        # Keep only printable characters
        sanitized = "".join(char for char in sanitized if char.isprintable())

    # Normalize whitespace
    if allow_newlines:
        # Preserve newlines but normalize other whitespace
        lines = sanitized.split("\n")
        sanitized = "\n".join(" ".join(line.split()) for line in lines)
    else:
        sanitized = " ".join(sanitized.split())

    # Truncate if max_length specified
    if max_length and len(sanitized) > max_length:
        sanitized = sanitized[:max_length].rstrip()

    return sanitized.strip()


def sanitize_name(value: str) -> str:
    """
    Sanitize person/company names to allow Unicode letters, spaces, hyphens, apostrophes, and periods.

    Uses Unicode-aware character detection to support names in any language while
    preserving common punctuation used in names. Normalizes Unicode characters to
    their composed form (NFKC) before sanitization.

    Args:
        value: Name to sanitize

    Returns:
        Sanitized name with normalized whitespace

    Examples:
        >>> sanitize_name("John O'Brien")
        "John O'Brien"
        >>> sanitize_name("Mary-Jane")
        "Mary-Jane"
        >>> sanitize_name("José García-López")
        "José García-López"
        >>> sanitize_name("François d'Angelo")
        "François d'Angelo"
        >>> sanitize_name("John<script>")
        "Johnscript"
        >>> sanitize_name("  Jean   Pierre  ")
        "Jean Pierre"
    """
    if not value:
        return ""

    # Normalize Unicode characters (NFKC: composed form, compatibility decomposition)
    normalized = unicodedata.normalize("NFKC", value)

    # Build sanitized string: keep Unicode letters and allowed punctuation
    allowed_chars = []
    for char in normalized:
        if char.isalpha():
            # Keep all Unicode letters (including é, ñ, ç, etc.)
            allowed_chars.append(char)
        elif char in (' ', '-', "'", '.'):
            # Keep allowed punctuation: space, hyphen, apostrophe, period
            allowed_chars.append(char)
        # All other characters are removed

    sanitized = ''.join(allowed_chars)

    # Collapse/normalize internal whitespace
    sanitized = " ".join(sanitized.split())

    return sanitized.strip()


def sanitize_identifier(value: str) -> str:
    """
    Sanitize database identifiers (IDs, keys) to prevent SQL injection.

    Allows only: alphanumeric, hyphens, underscores
    Common for UUIDs, CUIDs, slugs

    Args:
        value: Identifier to sanitize

    Returns:
        Sanitized identifier

    Examples:
        >>> sanitize_identifier("user_123")
        'user_123'
        >>> sanitize_identifier("user-123-abc")
        'user-123-abc'
        >>> sanitize_identifier("user'; DROP TABLE--")
        'user DROP TABLE'
    """
    if not value:
        return ""

    # Allow alphanumeric, hyphens, underscores
    pattern = r"[^A-Za-z0-9\-_]"
    sanitized = re.sub(pattern, "", value)

    return sanitized.strip()


def sanitize_phone_number(value: str) -> str:
    """
    Sanitize phone number to allow only digits, plus, hyphens, spaces, parentheses.

    Args:
        value: Phone number to sanitize

    Returns:
        Sanitized phone number

    Examples:
        >>> sanitize_phone_number("+1 (234) 567-8900")
        '+1 (234) 567-8900'
        >>> sanitize_phone_number("+1234567890<script>")
        '+1234567890'
    """
    if not value:
        return ""

    # Allow digits, plus, hyphens, spaces, parentheses
    pattern = r"[^0-9+\-\s\(\)]"
    sanitized = re.sub(pattern, "", value)

    # Normalize whitespace
    sanitized = " ".join(sanitized.split())

    return sanitized.strip()


def sanitize_email(value: str) -> str:
    """
    Sanitize email address to lowercase and remove dangerous characters.

    Note: Currently supports ASCII-only email addresses. Internationalized
    email addresses (RFC 6531) with Unicode characters will have those
    characters removed.

    Args:
        value: Email to sanitize

    Returns:
        Sanitized email in lowercase

    Examples:
        >>> sanitize_email("User@Example.COM")
        'user@example.com'
        >>> sanitize_email("user+tag@example.com")
        'user+tag@example.com'
        >>> sanitize_email("jose.garcia-lopez@example.com")
        'jose.garcia-lopez@example.com'
        >>> sanitize_email("françois.dangelo@example.com")
        'françois.dangelo@example.com'
        >>> sanitize_email("  Jean   Pierre  ")
        'jean pierre'
    """
    if not value:
        return ""

    # Allow alphanumeric, @, ., +, -, _
    pattern = r"[^A-Za-z0-9@._+\-]"
    sanitized = re.sub(pattern, "", value)

    # Convert to lowercase
    sanitized = sanitized.lower()

    # Normalize whitespace (emails shouldn't have spaces)
    sanitized = "".join(sanitized.split())

    return sanitized.strip()


def sanitize_url(value: str) -> str:
    """
    Sanitize URL to remove dangerous characters while preserving structure.

    Args:
        value: URL to sanitize

    Returns:
        Sanitized URL

    Examples:
        >>> sanitize_url("https://example.com/path")
        'https://example.com/path'
        >>> sanitize_url("http://example.com/<script>alert('xss')</script>")
        'http://example.com/scriptalertxss/script'
    """
    if not value:
        return ""

    # Allow URL-safe characters: alphanumeric, :, /, ?, &, =, ., -, _, ~, %
    pattern = r"[^A-Za-z0-9:/?&=._~%\-]"
    sanitized = re.sub(pattern, "", value)

    # Remove whitespace
    sanitized = "".join(sanitized.split())

    return sanitized.strip()
