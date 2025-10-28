
from apps.medical_catalog.models import Medicine


class MedicineService:
    @staticmethod
    def create(*, data: dict, user=None) -> Medicine:
        # Filter out non-model fields
        model_fields = {
            'name', 'dosage_form', 'unit_price', 'route', 'duration'
        }
        filtered_data = {k: v for k, v in data.items() if k in model_fields}
        
        # Create instance and validate
        instance = Medicine(**filtered_data)
        instance.full_clean()
        instance.save()
        return instance

    @staticmethod
    def update(*, medicine_id: str, data: dict, user=None) -> Medicine:
        instance = Medicine.objects.get(pk=medicine_id)
        # Filter out non-model fields
        model_fields = {
            'name', 'dosage_form', 'unit_price', 'route', 'duration'
        }
        for field, value in data.items():
            if field in model_fields:
                setattr(instance, field, value)
        instance.full_clean()
        instance.save(update_fields=None)
        return instance

    @staticmethod
    def deactivate(*, medicine_id: str, user=None) -> None:
        instance = Medicine.objects.get(pk=medicine_id)
        instance.soft_delete(user=user)
        instance.save(update_fields=["is_deleted", "deleted_at", "deleted_by"])
