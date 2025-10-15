from typing import Dict

from apps.providers.models import Hospital


class HospitalService:
    @staticmethod
    def hospital_create(*, hospital_data: Dict, user=None) -> Hospital:
        return Hospital.objects.create(**hospital_data)

    @staticmethod
    def hospital_update(*, hospital_id: str, update_data: Dict, user=None) -> Hospital:
        hospital = Hospital.objects.get(pk=hospital_id)
        for field, value in update_data.items():
            setattr(hospital, field, value)
        hospital.save(update_fields=None)
        return hospital

    @staticmethod
    def hospital_deactivate(*, hospital_id: str, user=None) -> None:
        hospital = Hospital.objects.get(pk=hospital_id)
        hospital.soft_delete(user=user)
        hospital.save(update_fields=["is_deleted", "deleted_at", "deleted_by"])


