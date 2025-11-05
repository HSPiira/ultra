# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Django REST Framework backend for a health insurance management system. The project manages companies, schemes (insurance plans), members, providers, medical catalogs, and claims. Built with Django 5.2.7, DRF 3.16, and SQLite (development).

## Development Commands

### Environment Setup

```bash
# Install dependencies
pip install -r requirements.txt
pip install -r requirements-dev.txt

# Create environment configuration (optional, see Configuration section below)
cp .env.example .env
# Edit .env to set environment variables (SECRET_KEY, DEBUG, CORS_ALLOW_ALL_ORIGINS, etc.)

# Run migrations
python manage.py migrate

# Create superuser for admin access
python manage.py createsuperuser
```

### Running the Application

```bash
# Start development server
python manage.py runserver

# Access API at http://localhost:8000
# API documentation at http://localhost:8000/api/docs/ (Swagger)
# Admin interface at http://localhost:8000/admin/
```

### Testing

```bash
# Run all tests
python manage.py test

# Run tests for a specific app
python manage.py test apps.schemes
python manage.py test apps.companies

# Run a specific test file
python manage.py test apps.schemes.tests.test_api

# Run a specific test case or method
python manage.py test apps.schemes.tests.test_api.SchemesAPITests.test_scheme_crud
```

### Code Quality

```bash
# Format code with Black
black .

# Lint code with Ruff
ruff check .

# Auto-fix Ruff issues
ruff check --fix .
```

### Database Management

```bash
# Create migrations after model changes
python manage.py makemigrations

# Show migration status
python manage.py showmigrations

# Access database shell
python manage.py dbshell
```

## Architecture

### Project Structure

```text
backend/
├── ultra/                    # Django project settings
│   ├── settings.py          # Main configuration
│   ├── urls.py              # Root URL configuration
│   └── wsgi.py/asgi.py      # WSGI/ASGI application
├── apps/                    # All Django apps
│   ├── core/                # Shared base models, utilities, exceptions
│   ├── companies/           # Company and industry management
│   ├── schemes/             # Insurance schemes, plans, benefits
│   ├── members/             # Member/person management
│   ├── providers/           # Healthcare provider management
│   ├── medical_catalog/     # Medical services catalog
│   └── claims/              # Claims processing
└── db.sqlite3               # SQLite database (development)
```

### App Architecture Pattern

Each app follows the HackSoft Django Style Guide pattern with clear separation:

```text
app_name/
├── models/                  # Domain models
│   ├── __init__.py         # Exports all models
│   └── *.py                # Individual model files
├── selectors/               # Read operations (queries)
│   ├── __init__.py         # Exports all selectors
│   └── *_selector.py       # Domain-specific queries
├── services/                # Write operations (commands)
│   ├── __init__.py
│   └── *_service.py        # Business logic for writes
├── api/                     # API layer
│   ├── serializers.py      # DRF serializers
│   ├── views.py            # ViewSets and views
│   └── urls.py             # URL routing
├── tests/                   # Test files
│   ├── test_models.py
│   ├── test_api.py
│   └── test_services.py
├── admin.py                 # Django admin configuration
└── apps.py                  # App configuration
```

### Core Components

#### BaseModel (`apps.core.models.base.BaseModel`)

All domain models inherit from BaseModel which provides:
- **CUID-based primary keys** (`id` field): Generated using `cuid2` library for collision-resistant, sortable IDs
- **Timestamps**: `created_at`, `updated_at` (auto-managed)
- **Business status**: `status` field with choices (ACTIVE, INACTIVE, SUSPENDED, etc.)
- **Soft delete**: `is_deleted`, `deleted_at`, `deleted_by` fields
- **Custom managers**:
  - `objects`: Default manager (excludes soft-deleted, orders by `-created_at`)
  - `all_objects`: Includes soft-deleted records
- **Lifecycle methods**: `soft_delete()`, `restore()`, overridden `delete()`

#### Custom Exception Handler

Centralized error handling in `apps.core.exceptions.custom_exception_handler`:
- Wraps Django ValidationError and IntegrityError with consistent JSON format
- Suppresses expected error logs during tests using `IS_TESTING` flag
- Returns structured error responses: `{"success": false, "error": {"type": "...", "message": "...", "details": "..."}}`

#### Selector/Service Pattern

**Selectors** (`selectors/`) handle all read operations:
- Pure query functions (e.g., `scheme_list()`, `scheme_get()`, `scheme_statistics_get()`)
- No business logic, only data retrieval and filtering
- Named with pattern: `{model}_{operation}` (e.g., `scheme_list`, `benefit_get`)
- Return querysets or model instances
- Include specialized queries like `scheme_list_by_company()`, `scheme_health_score_get()`

**Services** (`services/`) handle all write operations:
- Business logic, validation, and state changes
- Use `@transaction.atomic` for data consistency
- Named with pattern: `{Model}Service.{model}_{operation}` (e.g., `SchemeService.scheme_create()`)
- Raise `ValidationError` for business rule violations
- Handle complex operations like duplicates checking, status management, bulk operations

Example service method signature:

```python
@staticmethod
@transaction.atomic
def scheme_create(*, scheme_data: dict, user=None):
    """Keyword-only arguments enforce explicit parameter passing."""
```

#### URL Configuration

- Root URLs in `ultra/urls.py` aggregate all app routers
- Each app has `api/urls.py` with a DRF DefaultRouter
- All app routers registered via `router.registry.extend(app_router.registry)`
- OpenAPI schema available at `/api/schema/`, docs at `/api/docs/`

### Testing Strategy

Tests use Django's TestCase with APIClient:
- **Setup**: Create test users, industries, companies, and related data in `setUp()`
- **Authentication**: Use `client.force_login(user)` for authenticated tests
- **Test naming**: `test_{feature}_{scenario}` (e.g., `test_scheme_crud`, `test_scheme_validation`)
- **Assertions**: Verify status codes, response data structure, database state
- **Coverage**: CRUD operations, validation rules, filtering, ordering, edge cases

Test data patterns:

```python
# Create test industry and company
self.industry = Industry.objects.create(
    industry_name="Technology",
    description="Technology companies"
)
self.company = Company.objects.create(
    company_name="Test Company",
    industry=self.industry,
    # ... other required fields
)
```

### Domain Models

#### Companies App

- **Company**: Client companies with contact info, industry reference
- **Industry**: Industry classification for companies
- Custom manager methods: `get_by_name()`, `has_members()`, `has_schemes()`
- Prevents deletion when related members/schemes exist

#### Schemes App

- **Scheme**: Insurance plans with company link, date ranges, limits
- **Plan**: Sub-plans within schemes
- **Benefit**: Specific benefits offered in plans
- **SchemeItem**: Generic foreign key linking schemes to providers/medical items

#### Members App

- Person/member management for company employees

#### Providers App

- Healthcare provider management

#### Medical Catalog App

- Medical services and procedures catalog

#### Claims App

- Claims processing and management

### Key Patterns

#### Validation Flow

1. Required field validation in services
2. Company ID resolution (string → Company instance)
3. Business rule validation (dates, uniqueness, status)
4. Duplicate checking with case-insensitive queries (`__iexact`)
5. Related entity status validation (e.g., company must be ACTIVE)

#### Status Management

Services provide status transition methods:
- `{model}_activate()`: Reactivate inactive records
- `{model}_deactivate()`: Soft delete and set INACTIVE status
- `{model}_suspend()`: Set SUSPENDED status with reason tracking
- `{models}_bulk_status_update()`: Batch status updates

#### Soft Delete

- Override `delete()` to call `soft_delete()` instead of hard delete
- Use `is_deleted=False` filters in queries via ActiveManager
- Access soft-deleted records via `all_objects` manager
- Store deletion metadata: `deleted_at`, `deleted_by`

## Coding Standards

This section defines coding standards and conventions for the Ultra backend Django project.

### Table of Contents

1. [Naming Conventions](#naming-conventions)
2. [Type Hints](#type-hints)
3. [Input Sanitization](#input-sanitization)
4. [Magic Strings & Constants](#magic-strings--constants)
5. [Service Layer Patterns](#service-layer-patterns)
6. [Selector Layer Patterns](#selector-layer-patterns)

### Naming Conventions

#### Selector Functions (Read Operations)

Selectors handle all read operations. Use consistent naming patterns:

**Pattern: `{model}_list()`**

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

**Pattern: `{model}_get()`**

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

**Pattern: `{model}_{specific}_get()`**

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

**Pattern: `{model}_list_by_{criteria}()`**

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

#### Service Methods (Write Operations)

Services handle all write operations. Use consistent naming patterns:

**Pattern: `{model}_create()`**

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

**Pattern: `{model}_update()`**

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

**Pattern: `{model}_{action}()`**

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

**Pattern: `{models}_bulk_{action}()`**

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

#### Variable Naming

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

### Type Hints

All service methods and selectors **MUST** have type hints for parameters and return values.

#### Basic Type Hints

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

#### Common Type Patterns

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

#### Why Type Hints Matter

1. **IDE Support**: Better autocomplete and error detection
2. **Documentation**: Self-documenting code
3. **Static Analysis**: Tools like mypy can catch errors before runtime
4. **Refactoring**: Safer refactoring with type awareness

### Input Sanitization

All user input **MUST** be sanitized before processing to prevent security vulnerabilities.

#### Using Sanitization Helpers

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

# Names (allow letters, spaces, hyphens, apostrophes) - Unicode-aware
name = sanitize_name(user_input)  # "José García-López" -> "José García-López"

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

#### Where to Sanitize

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

### Magic Strings & Constants

**NEVER** use magic strings. Always use enums and named constants.

#### Using Enums

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

#### Available Enums

Located in `apps/core/enums/choices.py`:

- `BusinessStatusChoices`: ACTIVE, INACTIVE, SUSPENDED
- `GenderChoices`: MALE, FEMALE
- `RelationshipChoices`: SELF, SPOUSE, CHILD
- `ClaimStatusChoices`: PENDING, APPROVED, REJECTED, PAID, CANCELLED

#### Creating New Enums

```python
# In apps/core/enums/choices.py
class PaymentMethodChoices(models.TextChoices):
    """Payment method choices."""
    CASH = "CASH", "Cash"
    CARD = "CARD", "Card"
    BANK_TRANSFER = "BANK_TRANSFER", "Bank Transfer"
    MOBILE_MONEY = "MOBILE_MONEY", "Mobile Money"
```

#### Named Constants

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

### Service Layer Patterns

#### Structure

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

#### Best Practices

1. **Always use `@transaction.atomic`** for write operations
2. **Use keyword-only arguments** (force `*` in signature)
3. **Include docstrings** with Args, Returns, Raises sections
4. **Validate before saving** - use custom error classes
5. **Handle race conditions** - rely on database constraints
6. **Return the entity** - for chainability and testing

### Selector Layer Patterns

#### Structure

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

#### Best Practices

1. **Return QuerySets** for list operations (allows chaining)
2. **Return single objects** for get operations
3. **Use type hints** for all parameters and returns
4. **Filter soft-deleted records** by default
5. **Raise NotFoundError** for missing entities
6. **Use keyword-only arguments** when multiple parameters

### Quick Reference

#### Do's ✅

- Use enums instead of magic strings
- Add type hints to all methods
- Sanitize all user input
- Use consistent naming conventions
- Include comprehensive docstrings
- Use `@transaction.atomic` for writes
- Filter `is_deleted=False` by default
- Use keyword-only arguments

#### Don'ts ❌

- Don't use magic strings for status values
- Don't skip type hints
- Don't trust user input without sanitization
- Don't mix naming conventions (get/retrieve/list)
- Don't skip docstrings on public methods
- Don't perform writes without transactions
- Don't return soft-deleted records by default
- Don't use positional-only arguments for services

### Enforcement

These standards are enforced through:

1. **Code Reviews**: All PRs must follow these standards
2. **Linting**: Ruff checks for basic style violations
3. **Type Checking**: mypy can be used for type hint validation
4. **Tests**: Write tests that verify these patterns

## Configuration

### Environment Variables

The application uses environment variables for sensitive settings. Copy `.env.example` to `.env` and configure:

**Required for Production**:
- `SECRET_KEY`: Django secret key (generate with: `python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"`)
- `DEBUG`: Set to `False` in production (default: `True`)
- `ALLOWED_HOSTS`: Comma-separated list of allowed hosts (default: `localhost,127.0.0.1,0.0.0.0,testserver`)

**CORS Configuration**:
- `CORS_ALLOW_ALL_ORIGINS`: Set to `False` in production (default: `False`)
- `CORS_ALLOWED_ORIGINS`: Comma-separated list of allowed origins when `CORS_ALLOW_ALL_ORIGINS=False` (default: `http://localhost:5173,http://127.0.0.1:5173`)

**Authentication**:
- `DEFAULT_PERMISSION_CLASS`: `IsAuthenticated` (production) or `AllowAny` (development/testing) (default: `IsAuthenticated`)

**Optional**:
- Database configuration (defaults to SQLite)
- Redis cache URL (defaults to local memory cache when `DEBUG=True`)

### Settings (`ultra/settings.py`)
- **Database**: SQLite for development (`db.sqlite3`), configurable via environment variables
- **Cache**: Local memory cache in DEBUG mode, Redis in production
- **CORS**: Configurable via environment variables (restrictive by default)
- **REST Framework**:
  - Pagination: 20 items per page
  - Filters: DjangoFilterBackend, SearchFilter, OrderingFilter
  - Auth: Session + Basic authentication
  - Permissions: Configurable via `DEFAULT_PERMISSION_CLASS` environment variable (default: `IsAuthenticated`)
  - Custom exception handler: `apps.core.exceptions.custom_exception_handler`
- **CSRF Protection**:
  - Enabled by default for all views
  - Login view (GET `/api/auth/login/`) returns CSRF token
  - Frontend must include CSRF token in `X-CSRFToken` header for POST/PUT/PATCH/DELETE requests
  - CSRF token available in login response (`csrfToken` field) and `csrftoken` cookie
- **Logging**: Suppresses expected validation/integrity errors during tests
- **Test Detection**: `IS_TESTING` flag for test-specific behavior

### Security Best Practices

**For Production**:
1. Set `SECRET_KEY` to a strong random value (never use the default)
2. Set `DEBUG=False`
3. Set `CORS_ALLOW_ALL_ORIGINS=False` and specify exact origins in `CORS_ALLOWED_ORIGINS`
4. Set `DEFAULT_PERMISSION_CLASS=IsAuthenticated` (default)
5. Use HTTPS for all communications
6. Configure `ALLOWED_HOSTS` to include only your domain(s)
7. Enable rate limiting (uncomment throttle settings in `REST_FRAMEWORK`)
8. Use PostgreSQL instead of SQLite for production
9. Configure Redis for caching and session storage

**CSRF Token Handling**:
- Frontend should call GET `/api/auth/login/` to obtain CSRF token before login
- Include CSRF token in `X-CSRFToken` header for all authenticated requests
- Token is also available in the `csrftoken` cookie

### Code Style (pyproject.toml)
- **Black**: Line length 88, target Python 3.11
- **Ruff**: Enforces PEP 8, imports, naming, best practices
  - Line length 88
  - Ignores E501 (line too long, handled by Black)

## Common Workflows

### Adding a New Model
1. Create model in `models/` directory inheriting from `BaseModel`
2. Add to `models/__init__.py` exports
3. Create selectors in `selectors/{model}_selector.py` for read operations
4. Create service class in `services/{model}_service.py` for write operations
5. Add serializers in `api/serializers.py` (inherit from `BaseSerializer` for common fields)
6. Create ViewSet in `api/views.py`
7. Register ViewSet in `api/urls.py` router
8. Run `python manage.py makemigrations` and `python manage.py migrate`
9. Write tests in `tests/` directory

### Adding Business Logic
- **Read operations**: Add function to appropriate selector file
- **Write operations**: Add static method to appropriate Service class
- Always use `@transaction.atomic` for write operations
- Raise `ValidationError` for business rule violations (handled by custom exception handler)
- Use keyword-only arguments (force `*` in function signature)

### API Development
- ViewSets inherit from `ModelViewSet` for full CRUD
- Use `filterset_fields`, `search_fields`, `ordering_fields` for filtering
- Customize serializers: list view (minimal), detail view (with nested data)
- Override `get_serializer_class()` for different serializers per action

### Working with Soft Delete
- Use default `objects` manager for active records only
- Use `all_objects` manager when soft-deleted records are needed
- Call `soft_delete(user=user)` instead of `delete()` in services
- Check `is_deleted=False` in filters when using custom queries
