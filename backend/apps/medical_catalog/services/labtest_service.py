from django.core.exceptions import ValidationError
from django.db import IntegrityError

from apps.core.exceptions.service_errors import NotFoundError, DuplicateError
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
        try:
            instance = LabTest(**filtered_data)
            instance.full_clean()
            instance.save()
            return instance
        except ValidationError as e:
            # Check if this is a uniqueness validation error, otherwise re-raise
            if hasattr(e, 'message_dict'):
                for field, messages in e.message_dict.items():
                    if any('already exists' in str(msg).lower() for msg in messages):
                        raise DuplicateError("LabTest", [field], f"LabTest with this {field} already exists")
            # Not a uniqueness error - re-raise original ValidationError
            raise
        except IntegrityError as e:
            # Database constraint violation
            error_msg = str(e).lower()
            if 'name' in error_msg or 'unique' in error_msg:
                raise DuplicateError("LabTest", ["name"], "LabTest with this name already exists")
            else:
                raise DuplicateError("LabTest", message="LabTest with duplicate unique field already exists")

    @staticmethod
    def update(*, labtest_id: str, data: dict, user=None) -> LabTest:
        try:
            instance = LabTest.objects.get(pk=labtest_id, is_deleted=False)
        except LabTest.DoesNotExist:
            raise NotFoundError("LabTest", labtest_id)

        # Filter out non-model fields
        model_fields = {
            'name', 'category', 'description', 'base_amount', 'normal_range', 'units'
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
                        raise DuplicateError("LabTest", [field], f"Another labtest with this {field} already exists")
            # Not a uniqueness error - re-raise original ValidationError
            raise
        except IntegrityError as e:
            # Database constraint violation
            error_msg = str(e).lower()
            if 'name' in error_msg or 'unique' in error_msg:
                raise DuplicateError("LabTest", ["name"], "Another labtest with this name already exists")
            else:
                raise DuplicateError("LabTest", message="LabTest with duplicate unique field already exists")

    @staticmethod
    def deactivate(*, labtest_id: str, user=None) -> None:
        try:
            instance = LabTest.objects.get(pk=labtest_id, is_deleted=False)
        except LabTest.DoesNotExist:
            raise NotFoundError("LabTest", labtest_id)

        instance.soft_delete(user=user)
        instance.save(update_fields=["is_deleted", "deleted_at", "deleted_by"])
