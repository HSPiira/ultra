from django.core.exceptions import ValidationError
from django.db import IntegrityError

from apps.core.exceptions.service_errors import NotFoundError, DuplicateError
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
        # Filter out non-model fields
        model_fields = {
            'name', 'category', 'description', 'base_amount', 'service_type'
        }
        filtered_data = {k: v for k, v in data.items() if k in model_fields}

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

        # Filter out non-model fields
        model_fields = {
            'name', 'category', 'description', 'base_amount', 'service_type'
        }
        for field, value in data.items():
            if field in model_fields:
                setattr(instance, field, value)

        try:
            instance.full_clean()
            instance.save(update_fields=None)
            return instance
        except ValidationError as e:
            # Check if this is a uniqueness validation error, otherwise re-raise
            if hasattr(e, 'message_dict'):
                for field, messages in e.message_dict.items():
                    if any('already exists' in str(msg).lower() for msg in messages):
                        raise DuplicateError("Service", [field], f"Another service with this {field} already exists") from e
            # Not a uniqueness error - re-raise original ValidationError
            raise
        except IntegrityError as e:
            # Database constraint violation - only raise DuplicateError for unique violations
            if is_unique_constraint_violation(e):
                # Check if we can identify the specific field from the error message
                error_msg = str(e).lower()
                if 'name' in error_msg:
                    raise DuplicateError("Service", ["name"], "Another service with this name already exists") from e
                else:
                    raise DuplicateError("Service", message="Service with these values already exists") from e
            else:
                # Other integrity errors (NOT NULL, FK, etc.) - re-raise
                raise

    @staticmethod
    def deactivate(*, service_id: str, user=None) -> None:
        try:
            instance = Service.objects.get(pk=service_id, is_deleted=False)
        except Service.DoesNotExist as e:
            raise NotFoundError("Service", service_id) from e

        instance.soft_delete(user=user)
        instance.save(update_fields=["is_deleted", "deleted_at", "deleted_by"])
