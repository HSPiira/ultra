from django.core.exceptions import ValidationError

from apps.core.enums.choices import BusinessStatusChoices
from apps.core.exceptions.service_errors import NotFoundError, InactiveEntityError
from apps.core.services import (
    BaseService,
    CSVExportMixin,
    RequiredFieldsRule,
    StringLengthRule,
)
from apps.providers.models import Hospital


class HospitalService(BaseService, CSVExportMixin):
    """
    Hospital business logic for write operations.
    Handles all hospital-related write operations including CRUD, validation,
    and business logic. Read operations are handled by selectors.
    
    Uses SOLID improvements:
    - Validation rules for extensible validation (OCP)
    - Standardized method signatures available (ISP)
    """
    
    # BaseService configuration
    entity_model = Hospital
    entity_name = "Hospital"
    unique_fields = []
    allowed_fields = {
        'name', 'address', 'city', 'state', 'country', 'postal_code',
        'contact_person', 'phone_number', 'email', 'website', 'branch_of', 'status'
    }
    validation_rules = [
        RequiredFieldsRule(["name"], "Hospital"),
        StringLengthRule("name", min_length=1, max_length=255),
    ]
    @classmethod
    def hospital_create(cls, *, hospital_data: dict, user=None) -> Hospital:
        """
        Create a new hospital with validation.
        
        Args:
            hospital_data: Dictionary containing hospital information
            user: User creating the hospital (for audit trail)
            
        Returns:
            Hospital: The created hospital instance
        """
        # Filter fields if allowed_fields is defined
        if cls.allowed_fields is not None:
            hospital_data = cls._filter_model_fields(hospital_data, cls.allowed_fields)
        
        # Apply validation rules (configured in BaseService)
        cls._apply_validation_rules(hospital_data)
        
        # Handle branch_of field using base method (self-referential FK)
        branch_of_id = hospital_data.pop('branch_of', None)
        temp_data = {'branch_of': branch_of_id}
        cls._resolve_foreign_key(
            temp_data, "branch_of", Hospital, "Hospital", validate_active=True, allow_none=True
        )
        hospital_data['branch_of'] = temp_data['branch_of']
        
        return Hospital.objects.create(**hospital_data)

    @classmethod
    def hospital_update(cls, *, hospital_id: str, update_data: dict, user=None) -> Hospital:
        """
        Update an existing hospital with validation.
        
        Args:
            hospital_id: ID of the hospital to update
            update_data: Dictionary containing fields to update
            user: User performing the update (for audit trail)
            
        Returns:
            Hospital: The updated hospital instance
        """
        # Get hospital using base method
        hospital = cls._get_entity(hospital_id)
        
        # Filter fields if allowed_fields is defined
        if cls.allowed_fields is not None:
            update_data = cls._filter_model_fields(update_data, cls.allowed_fields)
        
        # Merge with existing data for validation
        merged_data = {}
        for field in cls.allowed_fields:
            if hasattr(hospital, field):
                merged_data[field] = getattr(hospital, field)
        merged_data.update(update_data)
        
        # Apply validation rules (configured in BaseService)
        cls._apply_validation_rules(merged_data, entity=hospital)
        
        # Handle branch_of field using base method (self-referential FK)
        branch_of_id = update_data.pop('branch_of', None)
        if branch_of_id is not None:
            if branch_of_id:
                temp_data = {'branch_of': branch_of_id}
                cls._resolve_foreign_key(
                    temp_data, "branch_of", Hospital, "Hospital", validate_active=True
                )
                hospital.branch_of = temp_data['branch_of']
            else:
                hospital.branch_of = None
        
        # Update fields
        for field, value in update_data.items():
            setattr(hospital, field, value)
        hospital.save(update_fields=None)
        return hospital

    @classmethod
    def hospital_deactivate(cls, *, hospital_id: str, user=None) -> None:
        """Deactivate hospital using base method."""
        return BaseService.deactivate(cls, entity_id=hospital_id, user=user, soft_delete=True)
