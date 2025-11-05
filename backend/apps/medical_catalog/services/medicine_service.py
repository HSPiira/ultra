from django.core.exceptions import ValidationError
from django.db import IntegrityError

from apps.core.exceptions.service_errors import NotFoundError, DuplicateError
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
        # Filter out non-model fields
        model_fields = {
            'name', 'dosage_form', 'unit_price', 'route', 'duration'
        }
        filtered_data = {k: v for k, v in data.items() if k in model_fields}

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

        # Filter out non-model fields
        model_fields = {
            'name', 'dosage_form', 'unit_price', 'route', 'duration'
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
                        raise DuplicateError("Medicine", [field], f"Another medicine with this {field} already exists")
            # Not a uniqueness error - re-raise original ValidationError
            raise
        except IntegrityError as e:
            # Database constraint violation
            error_msg = str(e).lower()
            if 'name' in error_msg or 'unique' in error_msg:
                raise DuplicateError("Medicine", ["name"], "Another medicine with this name already exists")
            else:
                raise DuplicateError("Medicine", message="Medicine with duplicate unique field already exists")

    @staticmethod
    def deactivate(*, medicine_id: str, user=None) -> None:
        try:
            instance = Medicine.objects.get(pk=medicine_id, is_deleted=False)
        except Medicine.DoesNotExist:
            raise NotFoundError("Medicine", medicine_id)

        instance.soft_delete(user=user)
        instance.save(update_fields=["is_deleted", "deleted_at", "deleted_by"])
