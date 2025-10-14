from typing import Dict

from apps.medical_catalog.models import LabTest


class LabTestService:
    @staticmethod
    def create(*, data: Dict, user=None) -> LabTest:
        return LabTest.objects.create(**data)

    @staticmethod
    def update(*, labtest_id: str, data: Dict, user=None) -> LabTest:
        instance = LabTest.objects.get(pk=labtest_id)
        for field, value in data.items():
            setattr(instance, field, value)
        instance.save(update_fields=None)
        return instance

    @staticmethod
    def deactivate(*, labtest_id: str, user=None) -> None:
        instance = LabTest.objects.get(pk=labtest_id)
        instance.soft_delete(user=user)
        instance.save(update_fields=["is_deleted", "deleted_at", "deleted_by"])


