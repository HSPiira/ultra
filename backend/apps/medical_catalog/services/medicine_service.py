from apps.core.services import (
    BaseService,
    CSVExportMixin,
    RequiredFieldsRule,
    StringLengthRule,
)
from apps.medical_catalog.models import Medicine


class MedicineService(BaseService, CSVExportMixin):
    """
    Medicine business logic for write operations.
    Handles all medicine-related write operations including CRUD, validation,
    and business logic. Read operations are handled by selectors.
    
    Uses SOLID improvements:
    - Validation rules for extensible validation (OCP)
    - Standardized method signatures (ISP)
    - Allowed fields configuration
    """
    
    # BaseService configuration
    entity_model = Medicine
    entity_name = "Medicine"
    unique_fields = ["name"]
    allowed_fields = {'name', 'dosage_form', 'unit_price', 'route', 'duration'}
    validation_rules = [
        RequiredFieldsRule(["name"], "Medicine"),
        StringLengthRule("name", min_length=1, max_length=255),
    ]
    @classmethod
    def create(cls, *, data: dict, user=None) -> Medicine:
        """
        Create a new medicine using standardized base method.
        
        Uses validation rules and allowed_fields from BaseService configuration.
        """
        return super().create(data=data, user=user)

    @classmethod
    def update(cls, *, entity_id: str, data: dict, user=None) -> Medicine:
        """
        Update an existing medicine using standardized base method.
        
        Uses validation rules and allowed_fields from BaseService configuration.
        """
        return super().update(entity_id=entity_id, data=data, user=user)

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
