from django.core.exceptions import ValidationError
from django.db import IntegrityError

from apps.core.services import BaseService, CSVExportMixin
from apps.medical_catalog.models import Service


class ServiceService(BaseService, CSVExportMixin):
    """
    Service business logic for write operations.
    Handles all medical service-related write operations including CRUD, validation,
    and business logic. Read operations are handled by selectors.
    """
    
    # BaseService configuration
    entity_model = Service
    entity_name = "Service"
    unique_fields = ["name"]
    @staticmethod
    def create(*, data: dict, user=None) -> Service:
        # Filter out non-model fields using base method
        model_fields = {
            'name', 'category', 'description', 'base_amount', 'service_type'
        }
        filtered_data = ServiceService._filter_model_fields(data, model_fields)

        # Create instance and validate
        try:
            instance = Service(**filtered_data)
            instance.full_clean()
            instance.save()
            return instance
        except ValidationError as e:
            ServiceService._handle_validation_error(e)
        except IntegrityError as e:
            ServiceService._handle_integrity_error(e)

    @staticmethod
    def update(*, service_id: str, data: dict, user=None) -> Service:
        # Get service using base method
        instance = ServiceService._get_entity(service_id)

        # Filter out non-model fields using base method
        model_fields = {
            'name', 'category', 'description', 'base_amount', 'service_type'
        }
        filtered_data = ServiceService._filter_model_fields(data, model_fields)
        
        # Update fields
        for field, value in filtered_data.items():
            setattr(instance, field, value)

        try:
            instance.full_clean()
            instance.save(update_fields=None)
            return instance
        except ValidationError as e:
            ServiceService._handle_validation_error(e)
        except IntegrityError as e:
            ServiceService._handle_integrity_error(e)

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
