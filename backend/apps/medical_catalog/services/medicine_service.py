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
    def medicine_create(cls, *, medicine_data: dict, user=None) -> Medicine:
        """
        Create a new medicine with validation.
        
        Args:
            medicine_data: Dictionary containing medicine information
            user: User creating the medicine (for audit trail)
            
        Returns:
            Medicine: The created medicine instance
        """
        return super().create(data=medicine_data, user=user)

    @classmethod
    def medicine_update(cls, *, medicine_id: str, update_data: dict, user=None) -> Medicine:
        """
        Update an existing medicine with validation.
        
        Args:
            medicine_id: ID of the medicine to update
            update_data: Dictionary containing fields to update
            user: User performing the update (for audit trail)
            
        Returns:
            Medicine: The updated medicine instance
        """
        return super().update(entity_id=medicine_id, data=update_data, user=user)

    @classmethod
    def medicine_deactivate(cls, *, medicine_id: str, user=None) -> None:
        """Deactivate medicine using base method."""
        return BaseService.deactivate(cls, entity_id=medicine_id, user=user, soft_delete=True)
