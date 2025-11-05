from django.core.exceptions import ValidationError
from django.db import IntegrityError

from apps.core.services import BaseService, CSVExportMixin
from apps.medical_catalog.models import Medicine


class MedicineService(BaseService, CSVExportMixin):
    """
    Medicine business logic for write operations.
    Handles all medicine-related write operations including CRUD, validation,
    and business logic. Read operations are handled by selectors.
    """
    
    # BaseService configuration
    entity_model = Medicine
    entity_name = "Medicine"
    unique_fields = ["name"]
    @staticmethod
    def create(*, data: dict, user=None) -> Medicine:
        # Filter out non-model fields using base method
        model_fields = {
            'name', 'dosage_form', 'unit_price', 'route', 'duration'
        }
        filtered_data = MedicineService._filter_model_fields(data, model_fields)

        # Create instance and validate
        try:
            instance = Medicine(**filtered_data)
            instance.full_clean()
            instance.save()
            return instance
        except ValidationError as e:
            MedicineService._handle_validation_error(e)
        except IntegrityError as e:
            MedicineService._handle_integrity_error(e)

    @staticmethod
    def update(*, medicine_id: str, data: dict, user=None) -> Medicine:
        # Get medicine using base method
        instance = MedicineService._get_entity(medicine_id)

        # Filter out non-model fields using base method
        model_fields = {
            'name', 'dosage_form', 'unit_price', 'route', 'duration'
        }
        filtered_data = MedicineService._filter_model_fields(data, model_fields)
        
        # Update fields
        for field, value in filtered_data.items():
            setattr(instance, field, value)

        try:
            instance.full_clean()
            instance.save(update_fields=None)
            return instance
        except ValidationError as e:
            MedicineService._handle_validation_error(e)
        except IntegrityError as e:
            MedicineService._handle_integrity_error(e)

    @staticmethod
    def deactivate(*, medicine_id: str, user=None) -> None:
        """Deactivate medicine using base method."""
        instance = MedicineService._get_entity(medicine_id)
        # Use model's soft_delete if available (handles deleted_at, deleted_by)
        if hasattr(instance, 'soft_delete'):
            instance.soft_delete(user=user)
            instance.save(update_fields=["is_deleted", "deleted_at", "deleted_by"])
        else:
            # Fallback to base deactivate (call via class to avoid recursion)
            from apps.core.services.base_service import BaseService
            BaseService.deactivate(entity_id=medicine_id, soft_delete=True, user=user)
