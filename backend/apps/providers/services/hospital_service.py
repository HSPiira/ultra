
from apps.providers.models import Hospital


class HospitalService:
    @staticmethod
    def hospital_create(*, hospital_data: dict, user=None) -> Hospital:
        # Handle branch_of field properly
        branch_of_id = hospital_data.pop('branch_of', None)
        if branch_of_id:
            try:
                branch_of = Hospital.objects.get(pk=branch_of_id)
                hospital_data['branch_of'] = branch_of
            except Hospital.DoesNotExist:
                # If branch hospital doesn't exist, ignore the field
                pass
        
        return Hospital.objects.create(**hospital_data)

    @staticmethod
    def hospital_update(*, hospital_id: str, update_data: dict, user=None) -> Hospital:
        hospital = Hospital.objects.get(pk=hospital_id)
        
        # Handle branch_of field properly
        branch_of_id = update_data.pop('branch_of', None)
        if branch_of_id is not None:
            if branch_of_id:
                try:
                    branch_of = Hospital.objects.get(pk=branch_of_id)
                    hospital.branch_of = branch_of
                except Hospital.DoesNotExist:
                    # If branch hospital doesn't exist, ignore the field
                    pass
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
