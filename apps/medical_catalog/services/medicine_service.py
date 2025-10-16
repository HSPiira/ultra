
from apps.medical_catalog.models import Medicine


class MedicineService:
    @staticmethod
    def create(*, data: dict, user=None) -> Medicine:
        return Medicine.objects.create(**data)

    @staticmethod
    def update(*, medicine_id: str, data: dict, user=None) -> Medicine:
        instance = Medicine.objects.get(pk=medicine_id)
        for field, value in data.items():
            setattr(instance, field, value)
        instance.save(update_fields=None)
        return instance

    @staticmethod
    def deactivate(*, medicine_id: str, user=None) -> None:
        instance = Medicine.objects.get(pk=medicine_id)
        instance.soft_delete(user=user)
        instance.save(update_fields=["is_deleted", "deleted_at", "deleted_by"])
