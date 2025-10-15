from typing import Dict

from apps.providers.models import Doctor


class DoctorService:
    @staticmethod
    def doctor_create(*, doctor_data: Dict, user=None) -> Doctor:
        return Doctor.objects.create(**doctor_data)

    @staticmethod
    def doctor_update(*, doctor_id: str, update_data: Dict, user=None) -> Doctor:
        doctor = Doctor.objects.get(pk=doctor_id)
        for field, value in update_data.items():
            setattr(doctor, field, value)
        doctor.save(update_fields=None)
        return doctor

    @staticmethod
    def doctor_deactivate(*, doctor_id: str, user=None) -> None:
        doctor = Doctor.objects.get(pk=doctor_id)
        doctor.soft_delete(user=user)
        doctor.save(update_fields=["is_deleted", "deleted_at", "deleted_by"])


