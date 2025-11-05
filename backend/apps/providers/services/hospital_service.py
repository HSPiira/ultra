from django.core.exceptions import ValidationError

from apps.core.enums.choices import BusinessStatusChoices
from apps.core.exceptions.service_errors import NotFoundError, InactiveEntityError
from apps.core.services import BaseService, CSVExportMixin
from apps.providers.models import Hospital


class HospitalService(BaseService, CSVExportMixin):
    """
    Hospital business logic for write operations.
    Handles all hospital-related write operations including CRUD, validation,
    and business logic. Read operations are handled by selectors.
    """
    
    # BaseService configuration
    entity_model = Hospital
    entity_name = "Hospital"
    unique_fields = []
    @staticmethod
    def hospital_create(*, hospital_data: dict, user=None) -> Hospital:
        # Handle branch_of field using base method (self-referential FK)
        branch_of_id = hospital_data.pop('branch_of', None)
        if branch_of_id:
            HospitalService._resolve_foreign_key(
                {'branch_of': branch_of_id}, "branch_of", Hospital, "Hospital", validate_active=True, allow_none=True
            )
            hospital_data['branch_of'] = {'branch_of': branch_of_id}.get('branch_of')
        
        return Hospital.objects.create(**hospital_data)

    @staticmethod
    def hospital_update(*, hospital_id: str, update_data: dict, user=None) -> Hospital:
        # Get hospital using base method
        hospital = HospitalService._get_entity(hospital_id)
        
        # Handle branch_of field using base method (self-referential FK)
        branch_of_id = update_data.pop('branch_of', None)
        if branch_of_id is not None:
            if branch_of_id:
                temp_data = {'branch_of': branch_of_id}
                HospitalService._resolve_foreign_key(
                    temp_data, "branch_of", Hospital, "Hospital", validate_active=True, allow_none=True
                )
                hospital.branch_of = temp_data['branch_of']
            else:
                hospital.branch_of = None
        
        for field, value in update_data.items():
            setattr(hospital, field, value)
        hospital.save(update_fields=None)
        return hospital

    @staticmethod
    def hospital_deactivate(*, hospital_id: str, user=None) -> None:
        hospital = Hospital.objects.get(pk=hospital_id)
        hospital.soft_delete(user=user)
        hospital.save(update_fields=["is_deleted", "deleted_at", "deleted_by"])
