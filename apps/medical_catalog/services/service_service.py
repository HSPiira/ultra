from typing import Dict

from apps.medical_catalog.models import Service


class ServiceService:
    @staticmethod
    def create(*, data: Dict, user=None) -> Service:
        return Service.objects.create(**data)

    @staticmethod
    def update(*, service_id: str, data: Dict, user=None) -> Service:
        instance = Service.objects.get(pk=service_id)
        for field, value in data.items():
            setattr(instance, field, value)
        instance.save(update_fields=None)
        return instance

    @staticmethod
    def deactivate(*, service_id: str, user=None) -> None:
        instance = Service.objects.get(pk=service_id)
        instance.soft_delete(user=user)
        instance.save(update_fields=["is_deleted", "deleted_at", "deleted_by"])


