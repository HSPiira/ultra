# Coding Standards for Ultra Backend

This document defines coding standards and conventions for the Ultra backend Django project.

## Table of Contents

1. [Naming Conventions](#naming-conventions)
2. [Type Hints](#type-hints)
3. [Input Sanitization](#input-sanitization)
4. [Magic Strings & Constants](#magic-strings--constants)
5. [Service Layer Patterns](#service-layer-patterns)
6. [Selector Layer Patterns](#selector-layer-patterns)

## Naming Conventions

### Selector Functions (Read Operations)

Selectors handle all read operations. Use consistent naming patterns:

#### Pattern: `{model}_list()`
Returns a queryset of multiple objects, often with filtering.

```python
def company_list(*, filters: dict = None) -> QuerySet[Company]:
    """
    Get a list of companies with optional filtering.

    Args:
        filters: Optional dictionary of filter parameters

    Returns:
        QuerySet of Company objects
    """
    qs = Company.objects.filter(is_deleted=False)

    if filters:
        if filters.get("industry"):
            qs = qs.filter(industry_id=filters["industry"])

    return qs
```

**Usage**: `company_list()`, `scheme_list()`, `member_list()`

#### Pattern: `{model}_get()`
Returns a single object by ID or raises NotFoundError.

```python
def company_get(*, company_id: str) -> Company:
    """
    Get a single company by ID.

    Args:
        company_id: Company ID

    Returns:
        Company object

    Raises:
        NotFoundError: If company doesn't exist
    """
    try:
        return Company.objects.get(id=company_id, is_deleted=False)
    except Company.DoesNotExist as exc:
        raise NotFoundError("Company", company_id) from exc
```

**Usage**: `company_get()`, `scheme_get()`, `member_get()`

#### Pattern: `{model}_{specific}_get()`
Returns specific derived data or calculations.

```python
def scheme_health_score_get(*, scheme_id: str) -> float:
    """
    Calculate health score for a scheme.

    Args:
        scheme_id: Scheme ID

    Returns:
        Health score as float between 0.0 and 1.0
    """
    # Implementation
    pass
```

**Usage**: `scheme_health_score_get()`, `company_statistics_get()`

#### Pattern: `{model}_list_by_{criteria}()`
Returns queryset filtered by specific criteria.

```python
def scheme_list_by_company(*, company_id: str) -> QuerySet[Scheme]:
    """
    Get all schemes for a specific company.

    Args:
        company_id: Company ID

    Returns:
        QuerySet of Scheme objects
    """
    return Scheme.objects.filter(company_id=company_id, is_deleted=False)
```

**Usage**: `scheme_list_by_company()`, `member_list_by_scheme()`

### Service Methods (Write Operations)

Services handle all write operations. Use consistent naming patterns:

#### Pattern: `{model}_create()`
Creates a new instance with validation.

```python
@staticmethod
@transaction.atomic
def company_create(*, company_data: dict, user=None) -> Company:
    """
    Create a new company with validation.

    Args:
        company_data: Dictionary containing company information
        user: User creating the company (for audit trail)

    Returns:
        Created Company instance

    Raises:
        RequiredFieldError: If required field is missing
        DuplicateError: If company already exists
    """
    # Validation logic
    # Creation logic
    return company
```

#### Pattern: `{model}_update()`
Updates an existing instance.

```python
@staticmethod
@transaction.atomic
def company_update(*, company_id: str, company_data: dict, user=None) -> Company:
    """
    Update an existing company.

    Args:
        company_id: ID of company to update
        company_data: Dictionary containing updated fields
        user: User updating the company

    Returns:
        Updated Company instance
    """
    company = Company.objects.select_for_update().get(pk=company_id)
    # Update logic
    return company
```

#### Pattern: `{model}_{action}()`
Performs specific business actions.

```python
@staticmethod
@transaction.atomic
def company_activate(*, company_id: str, user=None) -> Company:
    """Activate a suspended company."""
    pass

@staticmethod
@transaction.atomic
def company_deactivate(*, company_id: str, user=None) -> Company:
    """Deactivate (soft delete) a company."""
    pass
```

**Common Actions**: `activate`, `deactivate`, `suspend`, `merge`, `transfer`

#### Pattern: `{models}_bulk_{action}()`
Performs actions on multiple instances.

```python
@staticmethod
@transaction.atomic
def companies_bulk_status_update(*, company_ids: list[str], status: str, user=None) -> int:
    """
    Bulk update status for multiple companies.

    Args:
        company_ids: List of company IDs
        status: New status value
        user: User performing the action

    Returns:
        Number of companies updated
    """
    pass
```

### Variable Naming

- Use `snake_case` for variables, functions, and methods
- Use `PascalCase` for classes
- Use `SCREAMING_SNAKE_CASE` for constants
- Avoid single-letter variables except for loops (`i`, `j`, `k`)

```python
# Good
user_count = 10
MAX_PAGE_SIZE = 100

class CompanyService:
    pass

# Bad
userCount = 10  # camelCase
max_page_size = 100  # should be constant
```

## Type Hints

All service methods and selectors **MUST** have type hints for parameters and return values.

### Basic Type Hints

```python
from typing import Optional, Any
from django.db.models import QuerySet

def company_get(*, company_id: str) -> Company:
    """Get a single company."""
    pass

def company_list(*, filters: Optional[dict] = None) -> QuerySet[Company]:
    """Get list of companies."""
    pass

@staticmethod
@transaction.atomic
def company_create(*, company_data: dict[str, Any], user=None) -> Company:
    """Create a company."""
    pass
```

### Common Type Patterns

```python
# Optional values
def function(value: Optional[str] = None) -> Optional[Company]:
    pass

# Dictionaries
def function(data: dict[str, Any]) -> dict[str, int]:
    pass

# Lists
def function(ids: list[str]) -> list[Company]:
    pass

# Union types (Python 3.10+)
def function(value: str | int) -> Company | None:
    pass

# QuerySets
def function() -> QuerySet[Company]:
    pass
```

### Why Type Hints Matter

1. **IDE Support**: Better autocomplete and error detection
2. **Documentation**: Self-documenting code
3. **Static Analysis**: Tools like mypy can catch errors before runtime
4. **Refactoring**: Safer refactoring with type awareness

## Input Sanitization

All user input **MUST** be sanitized before processing to prevent security vulnerabilities.

### Using Sanitization Helpers

Import from `apps.core.utils.sanitizers`:

```python
from apps.core.utils.sanitizers import (
    sanitize_alphanumeric,
    sanitize_card_code,
    sanitize_text,
    sanitize_name,
    sanitize_identifier,
    sanitize_phone_number,
    sanitize_email,
    sanitize_url,
)

# Card codes
card_code = sanitize_card_code(user_input)  # "abc" -> "ABC"

# Names (allow letters, spaces, hyphens, apostrophes)
name = sanitize_name(user_input)  # "John O'Brien" -> "John O'Brien"

# General text (remove control characters)
description = sanitize_text(user_input, max_length=500)

# Identifiers (alphanumeric, hyphens, underscores only)
user_id = sanitize_identifier(user_input)

# Email (lowercase, remove dangerous chars)
email = sanitize_email(user_input)  # "User@Example.COM" -> "user@example.com"

# Phone numbers
phone = sanitize_phone_number(user_input)

# URLs
website = sanitize_url(user_input)
```

### Where to Sanitize

1. **Serializers**: Sanitize in `validate_` methods
2. **Services**: Sanitize before database operations
3. **Models**: Sanitize in `clean()` methods

```python
# In serializer
def validate_card_code(self, value):
    """Validate and sanitize card code."""
    sanitized = sanitize_card_code(value)
    if len(sanitized) != 3:
        raise serializers.ValidationError("Card code must be exactly 3 characters")
    return sanitized

# In service
@staticmethod
@transaction.atomic
def company_create(*, company_data: dict, user=None) -> Company:
    # Sanitize string inputs
    if company_data.get("company_name"):
        company_data["company_name"] = sanitize_name(company_data["company_name"])

    if company_data.get("email"):
        company_data["email"] = sanitize_email(company_data["email"])

    # Continue with creation
    pass
```

## Magic Strings & Constants

**NEVER** use magic strings. Always use enums and named constants.

### Using Enums

```python
# ❌ BAD - Magic strings
if company.status == "ACTIVE":
    pass

claim.claim_status = "PENDING"

# ✅ GOOD - Use enums
from apps.core.enums.choices import BusinessStatusChoices, ClaimStatusChoices

if company.status == BusinessStatusChoices.ACTIVE:
    pass

claim.claim_status = ClaimStatusChoices.PENDING
```

### Available Enums

Located in `apps/core/enums/choices.py`:

- `BusinessStatusChoices`: ACTIVE, INACTIVE, SUSPENDED
- `GenderChoices`: MALE, FEMALE
- `RelationshipChoices`: SELF, SPOUSE, CHILD
- `ClaimStatusChoices`: PENDING, APPROVED, REJECTED, PAID, CANCELLED

### Creating New Enums

```python
# In apps/core/enums/choices.py
class PaymentMethodChoices(models.TextChoices):
    """Payment method choices."""
    CASH = "CASH", "Cash"
    CARD = "CARD", "Card"
    BANK_TRANSFER = "BANK_TRANSFER", "Bank Transfer"
    MOBILE_MONEY = "MOBILE_MONEY", "Mobile Money"
```

### Named Constants

For non-enum constants, use module-level constants:

```python
# At top of module
MAX_PAGE_SIZE = 100
DEFAULT_PAGINATION_SIZE = 20
MAX_UPLOAD_SIZE = 10 * 1024 * 1024  # 10MB

# Use in code
if page_size > MAX_PAGE_SIZE:
    page_size = MAX_PAGE_SIZE
```

## Service Layer Patterns

### Structure

```python
class EntityService:
    """
    Entity business logic for write operations.

    Handles all entity-related write operations including CRUD, validation,
    and business logic. Read operations are handled by selectors.
    """

    @staticmethod
    @transaction.atomic
    def entity_create(*, entity_data: dict[str, Any], user=None) -> Entity:
        """Create method with type hints."""
        pass

    @staticmethod
    @transaction.atomic
    def entity_update(*, entity_id: str, entity_data: dict[str, Any], user=None) -> Entity:
        """Update method with type hints."""
        pass
```

### Best Practices

1. **Always use `@transaction.atomic`** for write operations
2. **Use keyword-only arguments** (force `*` in signature)
3. **Include docstrings** with Args, Returns, Raises sections
4. **Validate before saving** - use custom error classes
5. **Handle race conditions** - rely on database constraints
6. **Return the entity** - for chainability and testing

## Selector Layer Patterns

### Structure

```python
def entity_list(*, filters: Optional[dict] = None) -> QuerySet[Entity]:
    """
    Get a list of entities with optional filtering.

    Args:
        filters: Optional dictionary of filter parameters

    Returns:
        QuerySet of Entity objects
    """
    qs = Entity.objects.filter(is_deleted=False)

    if filters:
        # Apply filters
        pass

    return qs


def entity_get(*, entity_id: str) -> Entity:
    """
    Get a single entity by ID.

    Args:
        entity_id: Entity ID

    Returns:
        Entity object

    Raises:
        NotFoundError: If entity doesn't exist
    """
    try:
        return Entity.objects.get(id=entity_id, is_deleted=False)
    except Entity.DoesNotExist as exc:
        raise NotFoundError("Entity", entity_id) from exc
```

### Best Practices

1. **Return QuerySets** for list operations (allows chaining)
2. **Return single objects** for get operations
3. **Use type hints** for all parameters and returns
4. **Filter soft-deleted records** by default
5. **Raise NotFoundError** for missing entities
6. **Use keyword-only arguments** when multiple parameters

## Quick Reference

### Do's ✅

- Use enums instead of magic strings
- Add type hints to all methods
- Sanitize all user input
- Use consistent naming conventions
- Include comprehensive docstrings
- Use `@transaction.atomic` for writes
- Filter `is_deleted=False` by default
- Use keyword-only arguments

### Don'ts ❌

- Don't use magic strings for status values
- Don't skip type hints
- Don't trust user input without sanitization
- Don't mix naming conventions (get/retrieve/list)
- Don't skip docstrings on public methods
- Don't perform writes without transactions
- Don't return soft-deleted records by default
- Don't use positional-only arguments for services

## Enforcement

These standards are enforced through:

1. **Code Reviews**: All PRs must follow these standards
2. **Linting**: Ruff checks for basic style violations
3. **Type Checking**: mypy can be used for type hint validation
4. **Tests**: Write tests that verify these patterns

## Questions?

For questions about these standards, refer to:
- Django REST Framework documentation
- HackSoft Django Style Guide
- Python PEP 8 Style Guide
- This project's CLAUDE.md for Claude Code guidance
