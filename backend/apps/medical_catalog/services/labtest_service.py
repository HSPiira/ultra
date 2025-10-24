
from apps.medical_catalog.models import LabTest


class LabTestService:
    @staticmethod
    def create(*, data: dict, user=None) -> LabTest:
        # Filter out non-model fields
        model_fields = {
            'name', 'category', 'description', 'base_amount', 'normal_range', 'units'
        }
        filtered_data = {k: v for k, v in data.items() if k in model_fields}
        
        # Create instance and validate
        instance = LabTest(**filtered_data)
        instance.full_clean()
        instance.save()
        return instance

    @staticmethod
    def update(*, labtest_id: str, data: dict, user=None) -> LabTest:
        instance = LabTest.objects.get(pk=labtest_id)
        # Filter out non-model fields
        model_fields = {
            'name', 'category', 'description', 'base_amount', 'normal_range', 'units'
        }
        for field, value in data.items():
            if field in model_fields:
                setattr(instance, field, value)
        instance.full_clean()
        instance.save(update_fields=None)
        return instance

    @staticmethod
    def deactivate(*, labtest_id: str, user=None) -> None:
        instance = LabTest.objects.get(pk=labtest_id)
        instance.soft_delete(user=user)
        instance.save(update_fields=["is_deleted", "deleted_at", "deleted_by"])
