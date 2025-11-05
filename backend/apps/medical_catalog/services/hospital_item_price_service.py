from django.contrib.contenttypes.models import ContentType
from django.core.exceptions import ValidationError
from django.db import IntegrityError

from apps.core.exceptions.service_errors import NotFoundError
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
        # Filter out non-model fields using base method
        model_fields = {
            'hospital', 'content_type', 'object_id', 'amount', 'available'
        }
        filtered_data = HospitalItemPriceService._filter_model_fields(data, model_fields)

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

        # Filter out non-model fields using base method
        model_fields = {
            'hospital', 'content_type', 'object_id', 'amount', 'available'
        }
        filtered_data = HospitalItemPriceService._filter_model_fields(data, model_fields)

        # Resolve hospital FK using base method if being updated
        if "hospital" in filtered_data:
            hospital_id = filtered_data.pop("hospital")
            temp_data = {"hospital": hospital_id}
            HospitalItemPriceService._resolve_foreign_key(
                temp_data, "hospital", Hospital, "Hospital", validate_active=True
            )
            instance.hospital = temp_data["hospital"]

        # Handle content_type (ContentType is not a regular model, so handle manually)
        if "content_type" in filtered_data:
            content_type_id = filtered_data.pop("content_type")
            try:
                instance.content_type = ContentType.objects.get(pk=content_type_id)
            except ContentType.DoesNotExist as err:
                raise NotFoundError("ContentType", content_type_id) from err

        # Update remaining fields
        for field, value in filtered_data.items():
            setattr(instance, field, value)

        try:
            instance.save(update_fields=None)
            return instance
        except ValidationError as e:
            HospitalItemPriceService._handle_validation_error(e)
        except IntegrityError as e:
            HospitalItemPriceService._handle_integrity_error(e)

    @staticmethod
    def deactivate(*, price_id: str, user=None) -> None:
        """Deactivate hospital item price using base method."""
        instance = HospitalItemPriceService._get_entity(price_id)
        # Use model's soft_delete if available (handles deleted_at, deleted_by)
        if hasattr(instance, 'soft_delete'):
            instance.soft_delete(user=user)
            instance.save(update_fields=["is_deleted", "deleted_at", "deleted_by"])
        else:
            # Fallback to base deactivate (call via class to avoid recursion)
            from apps.core.services.base_service import BaseService
            BaseService.deactivate(entity_id=price_id, soft_delete=True, user=user)
