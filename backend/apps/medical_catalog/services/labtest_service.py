from django.core.exceptions import ValidationError
from django.db import IntegrityError

from apps.core.services import BaseService, CSVExportMixin
from apps.medical_catalog.models import LabTest


class LabTestService(BaseService, CSVExportMixin):
    """
    LabTest business logic for write operations.
    Handles all lab test-related write operations including CRUD, validation,
    and business logic. Read operations are handled by selectors.
    """
    
    # BaseService configuration
    entity_model = LabTest
    entity_name = "LabTest"
    unique_fields = ["name"]
    @staticmethod
    def create(*, data: dict, user=None) -> LabTest:
        # Filter out non-model fields using base method
        model_fields = {
            'name', 'category', 'description', 'base_amount', 'normal_range', 'units'
        }
        filtered_data = LabTestService._filter_model_fields(data, model_fields)

        # Create instance and validate
        try:
            instance = LabTest(**filtered_data)
            instance.full_clean()
            instance.save()
            return instance
        except ValidationError as e:
            LabTestService._handle_validation_error(e)
        except IntegrityError as e:
            LabTestService._handle_integrity_error(e)

    @staticmethod
    def update(*, labtest_id: str, data: dict, user=None) -> LabTest:
        # Get labtest using base method
        instance = LabTestService._get_entity(labtest_id)

        # Filter out non-model fields using base method
        model_fields = {
            'name', 'category', 'description', 'base_amount', 'normal_range', 'units'
        }
        filtered_data = LabTestService._filter_model_fields(data, model_fields)
        
        # Update fields
        for field, value in filtered_data.items():
            setattr(instance, field, value)

        try:
            instance.full_clean()
            instance.save(update_fields=None)
            return instance
        except ValidationError as e:
            LabTestService._handle_validation_error(e)
        except IntegrityError as e:
            LabTestService._handle_integrity_error(e)

    @staticmethod
    def deactivate(*, labtest_id: str, user=None) -> None:
        """Deactivate labtest using base method."""
        instance = LabTestService._get_entity(labtest_id)
        # Use model's soft_delete if available (handles deleted_at, deleted_by)
        if hasattr(instance, 'soft_delete'):
            instance.soft_delete(user=user)
            instance.save(update_fields=["is_deleted", "deleted_at", "deleted_by"])
        else:
            # Fallback to base deactivate (call via class to avoid recursion)
            from apps.core.services.base_service import BaseService
            BaseService.deactivate(entity_id=labtest_id, soft_delete=True, user=user)
