from typing import Dict

from apps.medical_catalog.models import HospitalItemPrice


class HospitalItemPriceService:
    @staticmethod
    def create(*, data: Dict, user=None) -> HospitalItemPrice:
        return HospitalItemPrice.objects.create(**data)

    @staticmethod
    def update(*, price_id: str, data: Dict, user=None) -> HospitalItemPrice:
        instance = HospitalItemPrice.objects.get(pk=price_id)
        for field, value in data.items():
            setattr(instance, field, value)
        instance.save(update_fields=None)
        return instance

    @staticmethod
    def deactivate(*, price_id: str, user=None) -> None:
        instance = HospitalItemPrice.objects.get(pk=price_id)
        instance.soft_delete(user=user)
        instance.save(update_fields=["is_deleted", "deleted_at", "deleted_by"])


