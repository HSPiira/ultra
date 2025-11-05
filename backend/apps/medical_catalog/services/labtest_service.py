from apps.core.services import (
    BaseService,
    CSVExportMixin,
    RequiredFieldsRule,
    StringLengthRule,
)
from apps.medical_catalog.models import LabTest


class LabTestService(BaseService, CSVExportMixin):
    """
    LabTest business logic for write operations.
    Handles all lab test-related write operations including CRUD, validation,
    and business logic. Read operations are handled by selectors.
    
    Uses SOLID improvements:
    - Validation rules for extensible validation (OCP)
    - Standardized method signatures (ISP)
    - Allowed fields configuration
    """
    
    # BaseService configuration
    entity_model = LabTest
    entity_name = "LabTest"
    unique_fields = ["name"]
    allowed_fields = {'name', 'category', 'description', 'base_amount', 'normal_range', 'units'}
    validation_rules = [
        RequiredFieldsRule(["name"], "LabTest"),
        StringLengthRule("name", min_length=1, max_length=255),
    ]
    @classmethod
    def create(cls, *, data: dict, user=None) -> LabTest:
        """
        Create a new lab test using standardized base method.
        
        Uses validation rules and allowed_fields from BaseService configuration.
        """
        return super().create(data=data, user=user)

    @classmethod
    def update(cls, *, entity_id: str, data: dict, user=None) -> LabTest:
        """
        Update an existing lab test using standardized base method.
        
        Uses validation rules and allowed_fields from BaseService configuration.
        """
        return super().update(entity_id=entity_id, data=data, user=user)

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
