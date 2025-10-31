from django.contrib.contenttypes.models import ContentType
from django.core.exceptions import ValidationError
from django.db import IntegrityError

from apps.core.exceptions.service_errors import NotFoundError, DuplicateError
from apps.medical_catalog.models import HospitalItemPrice
from apps.providers.models import Hospital


class HospitalItemPriceService:
    @staticmethod
    def create(*, data: dict, user=None) -> HospitalItemPrice:
        # Filter out non-model fields
        model_fields = {
            'hospital', 'content_type', 'object_id', 'amount', 'available'
        }
        filtered_data = {k: v for k, v in data.items() if k in model_fields}

        hospital_id = filtered_data.pop("hospital")
        try:
            hospital_instance = Hospital.objects.get(pk=hospital_id, is_deleted=False)
        except Hospital.DoesNotExist:
            raise NotFoundError("Hospital", hospital_id)

        content_type_id = filtered_data.pop("content_type")
        try:
            content_type_instance = ContentType.objects.get(pk=content_type_id)
        except ContentType.DoesNotExist:
            raise NotFoundError("ContentType", content_type_id)

        try:
            return HospitalItemPrice.objects.create(
                hospital=hospital_instance,
                content_type=content_type_instance,
                **filtered_data
            )
        except ValidationError as e:
            # Check if this is a uniqueness validation error, otherwise re-raise
            if hasattr(e, 'message_dict'):
                for field, messages in e.message_dict.items():
                    if any('already exists' in str(msg).lower() for msg in messages):
                        raise DuplicateError("HospitalItemPrice", [field], f"HospitalItemPrice with this {field} already exists")
            # Not a uniqueness error - re-raise original ValidationError
            raise
        except IntegrityError as e:
            # Database constraint violation
            error_msg = str(e).lower()
            if 'unique' in error_msg:
                raise DuplicateError("HospitalItemPrice", message="HospitalItemPrice with these values already exists")
            else:
                raise DuplicateError("HospitalItemPrice", message="HospitalItemPrice with duplicate unique field already exists")

    @staticmethod
    def update(*, price_id: str, data: dict, user=None) -> HospitalItemPrice:
        try:
            instance = HospitalItemPrice.objects.get(pk=price_id, is_deleted=False)
        except HospitalItemPrice.DoesNotExist:
            raise NotFoundError("HospitalItemPrice", price_id)

        # Filter out non-model fields
        model_fields = {
            'hospital', 'content_type', 'object_id', 'amount', 'available'
        }
        filtered_data = {k: v for k, v in data.items() if k in model_fields}

        if "hospital" in filtered_data:
            hospital_id = filtered_data.pop("hospital")
            try:
                instance.hospital = Hospital.objects.get(pk=hospital_id, is_deleted=False)
            except Hospital.DoesNotExist:
                raise NotFoundError("Hospital", hospital_id)

        if "content_type" in filtered_data:
            content_type_id = filtered_data.pop("content_type")
            try:
                instance.content_type = ContentType.objects.get(pk=content_type_id)
            except ContentType.DoesNotExist:
                raise NotFoundError("ContentType", content_type_id)

        for field, value in filtered_data.items():
            setattr(instance, field, value)

        try:
            instance.save(update_fields=None)
            return instance
        except ValidationError as e:
            # Check if this is a uniqueness validation error, otherwise re-raise
            if hasattr(e, 'message_dict'):
                for field, messages in e.message_dict.items():
                    if any('already exists' in str(msg).lower() for msg in messages):
                        raise DuplicateError("HospitalItemPrice", [field], f"Another hospitalitemprice with this {field} already exists")
            # Not a uniqueness error - re-raise original ValidationError
            raise
        except IntegrityError as e:
            # Database constraint violation
            error_msg = str(e).lower()
            if 'unique' in error_msg:
                raise DuplicateError("HospitalItemPrice", message="Another hospitalitemprice with these values already exists")
            else:
                raise DuplicateError("HospitalItemPrice", message="HospitalItemPrice with duplicate unique field already exists")

    @staticmethod
    def deactivate(*, price_id: str, user=None) -> None:
        try:
            instance = HospitalItemPrice.objects.get(pk=price_id, is_deleted=False)
        except HospitalItemPrice.DoesNotExist:
            raise NotFoundError("HospitalItemPrice", price_id)

        instance.soft_delete(user=user)
        instance.save(update_fields=["is_deleted", "deleted_at", "deleted_by"])
