"""
Structured error classes for service layer.

Provides consistent error handling with error codes and structured messages.
"""
from django.core.exceptions import ValidationError


class ServiceError(ValidationError):
    """
    Base service error with structured format.

    Attributes:
        code: Error code for programmatic handling
        message: Human-readable error message
        field: Optional field name for field-specific errors
        details: Optional additional context
    """

    def __init__(self, message: str, code: str = None, field: str = None, details: dict = None):
        """
        Initialize service error with structured format.

        Args:
            message: Human-readable error message
            code: Error code (defaults to class default_code)
            field: Field name for field-specific errors
            details: Additional context as dictionary
        """
        self.code = code or getattr(self, 'default_code', 'service_error')
        self.field = field
        self.details = details or {}

        # Format message for Django ValidationError compatibility
        if field:
            super().__init__({field: [message]}, code=self.code)
        else:
            super().__init__(message, code=self.code)

    def to_dict(self):
        """Convert to dictionary format for API responses."""
        error_dict = {
            'code': self.code,
            'message': str(self.message) if hasattr(self, 'message') else str(self),
        }
        if self.field:
            error_dict['field'] = self.field
        if self.details:
            error_dict['details'] = self.details
        return error_dict


# ---------------------------------------------------------------------
# Validation Errors
# ---------------------------------------------------------------------
class RequiredFieldError(ServiceError):
    """Required field is missing or empty."""
    default_code = 'required_field'

    def __init__(self, field: str):
        super().__init__(
            message=f"{field} is required",
            field=field
        )


class InvalidFormatError(ServiceError):
    """Field value has invalid format."""
    default_code = 'invalid_format'

    def __init__(self, field: str, message: str = None):
        super().__init__(
            message=message or f"Invalid {field} format",
            field=field
        )


class InvalidValueError(ServiceError):
    """Field value is invalid."""
    default_code = 'invalid_value'

    def __init__(self, field: str, message: str = None, details: dict = None):
        super().__init__(
            message=message or f"Invalid {field} value",
            field=field,
            details=details
        )


# ---------------------------------------------------------------------
# Business Logic Errors
# ---------------------------------------------------------------------
class NotFoundError(ServiceError):
    """Requested entity not found."""
    default_code = 'not_found'

    def __init__(self, entity: str, entity_id: str = None):
        message = f"{entity} not found"
        if entity_id:
            message += f" (ID: {entity_id})"
        super().__init__(
            message=message,
            details={'entity': entity, 'entity_id': entity_id} if entity_id else {'entity': entity}
        )


class DuplicateError(ServiceError):
    """Entity with same unique field(s) already exists."""
    default_code = 'duplicate_entity'

    def __init__(self, entity: str, fields: list = None, message: str = None):
        if not message:
            if fields:
                field_str = ' or '.join(fields)
                message = f"{entity} with this {field_str} already exists"
            else:
                message = f"{entity} already exists"

        super().__init__(
            message=message,
            details={'entity': entity, 'fields': fields} if fields else {'entity': entity}
        )


class BusinessRuleViolationError(ServiceError):
    """Business rule constraint violated."""
    default_code = 'business_rule_violation'

    def __init__(self, message: str, rule: str = None, details: dict = None):
        error_details = details or {}
        if rule:
            error_details['rule'] = rule
        super().__init__(
            message=message,
            details=error_details
        )


class StateTransitionError(ServiceError):
    """Invalid state transition attempted."""
    default_code = 'invalid_state_transition'

    def __init__(self, entity: str, from_state: str, to_state: str):
        super().__init__(
            message=f"Cannot transition {entity} from {from_state} to {to_state}",
            details={
                'entity': entity,
                'from_state': from_state,
                'to_state': to_state
            }
        )


class DependencyError(ServiceError):
    """Operation blocked by dependent entities."""
    default_code = 'dependency_exists'

    def __init__(self, entity: str, dependencies: list):
        dep_str = ', '.join(dependencies)
        super().__init__(
            message=f"Cannot proceed: {entity} has dependent {dep_str}",
            details={
                'entity': entity,
                'dependencies': dependencies
            }
        )


# ---------------------------------------------------------------------
# Permission & Authorization Errors
# ---------------------------------------------------------------------
class PermissionDeniedError(ServiceError):
    """User lacks permission for this operation."""
    default_code = 'permission_denied'

    def __init__(self, operation: str, entity: str = None):
        message = f"Permission denied for operation: {operation}"
        if entity:
            message += f" on {entity}"
        super().__init__(
            message=message,
            details={'operation': operation, 'entity': entity} if entity else {'operation': operation}
        )


class InactiveEntityError(ServiceError):
    """Operation not allowed on inactive/deleted entity."""
    default_code = 'inactive_entity'

    def __init__(self, entity: str, message: str = None):
        super().__init__(
            message=message or f"{entity} must be active for this operation",
            details={'entity': entity}
        )
