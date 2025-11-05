"""
Core service base classes and mixins.

Exports:
- BaseService: Abstract base class for all services
- CSVExportMixin: Mixin for CSV export functionality
- IServiceProtocol: Protocol defining service interface
- IValidationRule: Interface for validation rules
- IRepository: Interface for data access repositories
- DjangoRepository: Django ORM repository implementation
- Validation rule classes: RequiredFieldsRule, EmailFormatRule, etc.
"""
from apps.core.services.base_service import BaseService
from apps.core.services.mixins import CSVExportMixin
from apps.core.services.interfaces import (
    IServiceProtocol,
    IValidationRule,
    IRepository,
)
from apps.core.services.repositories import DjangoRepository
from apps.core.services.validation_rules import (
    RequiredFieldsRule,
    EmailFormatRule,
    StringLengthRule,
    DateRangeRule,
    ValidationRuleSet,
)

__all__ = [
    'BaseService',
    'CSVExportMixin',
    'IServiceProtocol',
    'IValidationRule',
    'IRepository',
    'DjangoRepository',
    'RequiredFieldsRule',
    'EmailFormatRule',
    'StringLengthRule',
    'DateRangeRule',
    'ValidationRuleSet',
]
