
from django.contrib.contenttypes.models import ContentType
from apps.medical_catalog.models import HospitalItemPrice
from apps.providers.models import Hospital


class HospitalItemPriceService:
    @staticmethod
    def create(*, data: dict, user=None) -> HospitalItemPrice:
        hospital_id = data.pop("hospital")
        hospital_instance = Hospital.objects.get(pk=hospital_id)

        content_type_id = data.pop("content_type")
        content_type_instance = ContentType.objects.get(pk=content_type_id)

        return HospitalItemPrice.objects.create(
            hospital=hospital_instance,
            content_type=content_type_instance,
            **data
        )

    @staticmethod
    def update(*, price_id: str, data: dict, user=None) -> HospitalItemPrice:
        instance = HospitalItemPrice.objects.get(pk=price_id)

        if "hospital" in data:
            hospital_id = data.pop("hospital")
            instance.hospital = Hospital.objects.get(pk=hospital_id)

        if "content_type" in data:
            content_type_id = data.pop("content_type")
            instance.content_type = ContentType.objects.get(pk=content_type_id)

        for field, value in data.items():
            setattr(instance, field, value)
        instance.save(update_fields=None)
        return instance

    @staticmethod
    def deactivate(*, price_id: str, user=None) -> None:
        instance = HospitalItemPrice.objects.get(pk=price_id)
        instance.soft_delete(user=user)
        instance.save(update_fields=["is_deleted", "deleted_at", "deleted_by"])
