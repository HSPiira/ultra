from django.core.exceptions import ValidationError
from django.db import IntegrityError

from apps.core.services import (
    BaseService,
    CSVExportMixin,
    RequiredFieldsRule,
    StringLengthRule,
)
from apps.medical_catalog.models import Service


class ServiceService(BaseService, CSVExportMixin):
    """
    Service business logic for write operations.
    Handles all medical service-related write operations including CRUD, validation,
    and business logic. Read operations are handled by selectors.
    
    Uses SOLID improvements:
    - Validation rules for extensible validation (OCP)
    - Standardized method signatures (ISP)
    - Allowed fields configuration
    """
    
    # BaseService configuration
    entity_model = Service
    entity_name = "Service"
    unique_fields = ["name"]
    allowed_fields = {'name', 'category', 'description', 'base_amount', 'service_type'}
    validation_rules = [
        RequiredFieldsRule(["name"], "Service"),
        StringLengthRule("name", min_length=1, max_length=255),
    ]
    @classmethod
    def service_create(cls, *, service_data: dict, user=None) -> Service:
        """
        Create a new service with validation.
        
        Args:
            service_data: Dictionary containing service information
            user: User creating the service (for audit trail)
            
        Returns:
            Service: The created service instance
        """
        return BaseService.create.__func__(cls, data=service_data, user=user)

    @classmethod
    def service_update(cls, *, service_id: str, update_data: dict, user=None) -> Service:
        """
        Update an existing service with validation.
        
        Args:
            service_id: ID of the service to update
            update_data: Dictionary containing fields to update
            user: User performing the update (for audit trail)
            
        Returns:
            Service: The updated service instance
        """
        return BaseService.update.__func__(cls, entity_id=service_id, data=update_data, user=user)

    @classmethod
    def service_deactivate(cls, *, service_id: str, user=None) -> None:
        """Deactivate service using base method."""
        return BaseService.deactivate(cls, entity_id=service_id, user=user, soft_delete=True)
