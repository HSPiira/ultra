from django.core.exceptions import ValidationError
from django.db import IntegrityError

from apps.core.exceptions.service_errors import NotFoundError, DuplicateError
from apps.medical_catalog.models import Service


class ServiceService:
    @staticmethod
    def create(*, data: dict, user=None) -> Service:
        # Filter out non-model fields
        model_fields = {
            'name', 'category', 'description', 'base_amount', 'service_type'
        }
        filtered_data = {k: v for k, v in data.items() if k in model_fields}

        # Create instance and validate
        try:
            instance = Service(**filtered_data)
            instance.full_clean()
            instance.save()
            return instance
        except ValidationError as e:
            # Check if this is a uniqueness validation error, otherwise re-raise
            if hasattr(e, 'message_dict'):
                for field, messages in e.message_dict.items():
                    if any('already exists' in str(msg).lower() for msg in messages):
                        raise DuplicateError("Service", [field], f"Service with this {field} already exists") from e
            # Not a uniqueness error - re-raise original ValidationError
            raise
        except IntegrityError as e:
            # Database constraint violation
            error_msg = str(e).lower()
            if 'name' in error_msg or 'unique' in error_msg:
                raise DuplicateError("Service", ["name"], "Service with this name already exists") from e
            else:
                # Unknown unique constraint violation - use generic field to ensure message_dict is created
                raise DuplicateError("Service", ["duplicate"], "Service with duplicate unique field already exists") from e

    @staticmethod
    def update(*, service_id: str, data: dict, user=None) -> Service:
        try:
            instance = Service.objects.get(pk=service_id, is_deleted=False)
        except Service.DoesNotExist:
            raise NotFoundError("Service", service_id)

        # Filter out non-model fields
        model_fields = {
            'name', 'category', 'description', 'base_amount', 'service_type'
        }
        for field, value in data.items():
            if field in model_fields:
                setattr(instance, field, value)

        try:
            instance.full_clean()
            instance.save(update_fields=None)
            return instance
        except ValidationError as e:
            # Check if this is a uniqueness validation error, otherwise re-raise
            if hasattr(e, 'message_dict'):
                for field, messages in e.message_dict.items():
                    if any('already exists' in str(msg).lower() for msg in messages):
                        raise DuplicateError("Service", [field], f"Another service with this {field} already exists") from e
            # Not a uniqueness error - re-raise original ValidationError
            raise
        except IntegrityError as e:
            # Database constraint violation
            error_msg = str(e).lower()
            if 'name' in error_msg or 'unique' in error_msg:
                raise DuplicateError("Service", ["name"], "Another service with this name already exists") from e
            else:
                # Unknown unique constraint violation - use generic field to ensure message_dict is created
                raise DuplicateError("Service", ["duplicate"], "Service with duplicate unique field already exists") from e

    @staticmethod
    def deactivate(*, service_id: str, user=None) -> None:
        try:
            instance = Service.objects.get(pk=service_id, is_deleted=False)
        except Service.DoesNotExist:
            raise NotFoundError("Service", service_id)

        instance.soft_delete(user=user)
        instance.save(update_fields=["is_deleted", "deleted_at", "deleted_by"])
