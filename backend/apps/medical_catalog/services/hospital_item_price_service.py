from django.contrib.contenttypes.models import ContentType
from django.core.exceptions import ValidationError
from django.db import IntegrityError

from apps.core.exceptions.service_errors import NotFoundError, DuplicateError, InvalidValueError
from apps.core.services import BaseService, CSVExportMixin
from apps.medical_catalog.models import HospitalItemPrice
from apps.providers.models import Hospital


class HospitalItemPriceService(BaseService, CSVExportMixin):
    """
    HospitalItemPrice business logic for write operations.
    Handles all hospital item price-related write operations including CRUD, validation,
    and business logic. Read operations are handled by selectors.
    """
    
    # BaseService configuration
    entity_model = HospitalItemPrice
    entity_name = "HospitalItemPrice"
    unique_fields = []  # Composite unique constraint handled manually
    @staticmethod
    def create(*, data: dict, user=None) -> HospitalItemPrice:
        # Filter out non-model fields
        model_fields = {
            'hospital', 'content_type', 'object_id', 'amount', 'available'
        }
        filtered_data = {k: v for k, v in data.items() if k in model_fields}

        # Resolve hospital FK using base method
        hospital_id = filtered_data.pop("hospital")
        temp_data = {"hospital": hospital_id}
        HospitalItemPriceService._resolve_foreign_key(
            temp_data, "hospital", Hospital, "Hospital", validate_active=True
        )
        hospital_instance = temp_data["hospital"]

        content_type_id = filtered_data.pop("content_type")
        try:
            content_type_instance = ContentType.objects.get(pk=content_type_id)
        except ContentType.DoesNotExist as err:
            raise NotFoundError("ContentType", content_type_id) from err

        try:
            return HospitalItemPrice.objects.create(
                hospital=hospital_instance,
                content_type=content_type_instance,
                **filtered_data
            )
        except ValidationError as e:
            HospitalItemPriceService._handle_validation_error(e)
        except IntegrityError as e:
            HospitalItemPriceService._handle_integrity_error(e)

    @staticmethod
    def update(*, price_id: str, data: dict, user=None) -> HospitalItemPrice:
        # Get price using base method
        instance = HospitalItemPriceService._get_entity(price_id)

        # Filter out non-model fields
        model_fields = {
            'hospital', 'content_type', 'object_id', 'amount', 'available'
        }
        filtered_data = {k: v for k, v in data.items() if k in model_fields}

        if "hospital" in filtered_data:
            hospital_id = filtered_data.pop("hospital")
            try:
                instance.hospital = Hospital.objects.get(pk=hospital_id, is_deleted=False)
            except Hospital.DoesNotExist as err:
                raise NotFoundError("Hospital", hospital_id) from err

        if "content_type" in filtered_data:
            content_type_id = filtered_data.pop("content_type")
            try:
                instance.content_type = ContentType.objects.get(pk=content_type_id)
            except ContentType.DoesNotExist as err:
                raise NotFoundError("ContentType", content_type_id) from err

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
                        raise DuplicateError("HospitalItemPrice", [field], f"Another hospitalitemprice with this {field} already exists") from e
            # Not a uniqueness error - re-raise original ValidationError
            raise
        except IntegrityError as e:
            # Database constraint violation - only raise DuplicateError for unique violations
            if is_unique_constraint_violation(e):
                raise DuplicateError("HospitalItemPrice", message="Another hospitalitemprice with these values already exists") from e
            else:
                # Other integrity errors (NOT NULL, FK, etc.) - raise InvalidValueError
                raise InvalidValueError(
                    field="database",
                    message="Database constraint violation",
                    details={"error": str(e)}
                ) from e

    @staticmethod
    def deactivate(*, price_id: str, user=None) -> None:
        try:
            instance = HospitalItemPrice.objects.get(pk=price_id, is_deleted=False)
        except HospitalItemPrice.DoesNotExist as err:
            raise NotFoundError("HospitalItemPrice", price_id) from err

        instance.soft_delete(user=user)
        instance.save(update_fields=["is_deleted", "deleted_at", "deleted_by"])
