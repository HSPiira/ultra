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
        'phone', 'email', 'website', 'branch_of', 'status'
    }
    validation_rules = [
        RequiredFieldsRule(["name"], "Hospital"),
        StringLengthRule("name", min_length=1, max_length=255),
    ]
    @staticmethod
    def hospital_create(*, hospital_data: dict, user=None) -> Hospital:
        # Convert to mutable dict if needed (DRF request.data might be QueryDict)
        data = dict(hospital_data)
        
        # Handle branch_of field using base method (self-referential FK)
        branch_of_id = data.pop('branch_of', None)
        if branch_of_id:
            temp_data = {'branch_of': branch_of_id}
            HospitalService._resolve_foreign_key(
                temp_data, "branch_of", Hospital, "Hospital", validate_active=True
            )
            data['branch_of'] = temp_data['branch_of']
        
        return Hospital.objects.create(**data)

    @staticmethod
    def hospital_update(*, hospital_id: str, update_data: dict, user=None) -> Hospital:
        # Get hospital using base method
        hospital = HospitalService._get_entity(hospital_id)
        
        # Convert to mutable dict if needed (DRF request.data might be QueryDict)
        data = dict(update_data)
        
        # Handle branch_of field using base method (self-referential FK)
        branch_of_id = data.pop('branch_of', None)
        if branch_of_id is not None:
            if branch_of_id:
                temp_data = {'branch_of': branch_of_id}
                HospitalService._resolve_foreign_key(
                    temp_data, "branch_of", Hospital, "Hospital", validate_active=True
                )
                hospital.branch_of = temp_data['branch_of']
            else:
                hospital.branch_of = None
        
        for field, value in data.items():
            setattr(hospital, field, value)
        hospital.save(update_fields=None)
        return hospital

    @staticmethod
    def hospital_deactivate(*, hospital_id: str, user=None) -> None:
        """Deactivate hospital using base method."""
        instance = HospitalService._get_entity(hospital_id)
        # Use model's soft_delete if available (handles deleted_at, deleted_by)
        if hasattr(instance, 'soft_delete'):
            instance.soft_delete(user=user)
            instance.save(update_fields=["is_deleted", "deleted_at", "deleted_by"])
        else:
            # Fallback to base deactivate
            from apps.core.services.base_service import BaseService
            BaseService.deactivate(entity_id=hospital_id, soft_delete=True, user=user)
