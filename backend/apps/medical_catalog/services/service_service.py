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
    @staticmethod
    def create(*, data: dict, user=None) -> Service:
        """
        Create a new service using standardized base method.
        
        Uses validation rules and allowed_fields from BaseService configuration.
        """
        # Call the classmethod with ServiceService class to use its configuration
        # Use __func__ to get the unbound method and call it with ServiceService
        return BaseService.create.__func__(ServiceService, data=data, user=user)

    @staticmethod
    def update(*, service_id: str = None, entity_id: str = None, data: dict, user=None) -> Service:
        """
        Update an existing service using standardized base method.
        
        Uses validation rules and allowed_fields from BaseService configuration.
        Accepts both 'service_id' (old) and 'entity_id' (new) for compatibility.
        """
        entity_id = entity_id or service_id
        if not entity_id:
            raise ValueError("Either 'service_id' or 'entity_id' must be provided")
        # Call the classmethod with ServiceService class to use its configuration
        # Use __func__ to get the unbound method and call it with ServiceService
        return BaseService.update.__func__(ServiceService, entity_id=entity_id, data=data, user=user)

    @staticmethod
    def deactivate(*, service_id: str, user=None) -> None:
        """Deactivate service using base method."""
        instance = ServiceService._get_entity(service_id)
        # Use model's soft_delete if available (handles deleted_at, deleted_by)
        if hasattr(instance, 'soft_delete'):
            instance.soft_delete(user=user)
            instance.save(update_fields=["is_deleted", "deleted_at", "deleted_by"])
        else:
            # Fallback to base deactivate (call via class to avoid recursion)
            from apps.core.services.base_service import BaseService
            BaseService.deactivate(entity_id=service_id, soft_delete=True, user=user)
