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
    def labtest_create(cls, *, labtest_data: dict, user=None) -> LabTest:
        """
        Create a new lab test with validation.
        
        Args:
            labtest_data: Dictionary containing lab test information
            user: User creating the lab test (for audit trail)
            
        Returns:
            LabTest: The created lab test instance
        """
        return super().create(data=labtest_data, user=user)

    @classmethod
    def labtest_update(cls, *, labtest_id: str, update_data: dict, user=None) -> LabTest:
        """
        Update an existing lab test with validation.
        
        Args:
            labtest_id: ID of the lab test to update
            update_data: Dictionary containing fields to update
            user: User performing the update (for audit trail)
            
        Returns:
            LabTest: The updated lab test instance
        """
        return super().update(entity_id=labtest_id, data=update_data, user=user)

    @classmethod
    def labtest_deactivate(cls, *, labtest_id: str, user=None) -> None:
        """Deactivate labtest using base method."""
        return cls.deactivate(entity_id=labtest_id, user=user, soft_delete=True)
