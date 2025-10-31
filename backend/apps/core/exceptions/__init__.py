"""
Custom exceptions for service layer error handling.
"""
from .custom_exception_handler import custom_exception_handler
from .service_errors import (
    ServiceError,
    RequiredFieldError,
    InvalidFormatError,
    InvalidValueError,
    NotFoundError,
    DuplicateError,
    BusinessRuleViolationError,
    StateTransitionError,
    DependencyError,
    PermissionDeniedError,
    InactiveEntityError,
)

__all__ = [
    "custom_exception_handler",
    "ServiceError",
    "RequiredFieldError",
    "InvalidFormatError",
    "InvalidValueError",
    "NotFoundError",
    "DuplicateError",
    "BusinessRuleViolationError",
    "StateTransitionError",
    "DependencyError",
    "PermissionDeniedError",
    "InactiveEntityError",
]
