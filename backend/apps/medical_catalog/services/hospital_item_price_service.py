from django.contrib.contenttypes.models import ContentType
from django.core.exceptions import ValidationError
from django.db import IntegrityError

from apps.core.exceptions.service_errors import NotFoundError, RequiredFieldError
from apps.core.services import (
    BaseService,
    CSVExportMixin,
    RequiredFieldsRule,
)
from apps.medical_catalog.models import HospitalItemPrice
from apps.providers.models import Hospital


class HospitalItemPriceService(BaseService, CSVExportMixin):
    """
    HospitalItemPrice business logic for write operations.
    Handles all hospital item price-related write operations including CRUD, validation,
    and business logic. Read operations are handled by selectors.
    
    Uses SOLID improvements:
    - Validation rules for extensible validation (OCP)
    - Allowed fields configuration
    """
    
    # BaseService configuration
    entity_model = HospitalItemPrice
    entity_name = "HospitalItemPrice"
    unique_fields = []  # Composite unique constraint handled manually
    allowed_fields = {'hospital', 'content_type', 'object_id', 'amount', 'available'}
    validation_rules = [
        RequiredFieldsRule(["hospital", "content_type", "object_id"], "HospitalItemPrice"),
    ]
    @classmethod
    def hospital_item_price_create(cls, *, price_data: dict, user=None) -> HospitalItemPrice:
        """
        Create a new hospital item price with validation.
        
        Args:
            price_data: Dictionary containing price information
            user: User creating the price (for audit trail)
            
        Returns:
            HospitalItemPrice: The created price instance
        """
        # Filter fields if allowed_fields is defined
        if cls.allowed_fields is not None:
            price_data = cls._filter_model_fields(price_data, cls.allowed_fields)

        # Apply validation rules
        cls._apply_validation_rules(price_data)

        # Resolve hospital FK using base method
        hospital_id = price_data.pop("hospital", None)
        if hospital_id:
            temp_data = {"hospital": hospital_id}
            cls._resolve_foreign_key(
                temp_data, "hospital", Hospital, "Hospital", validate_active=True
            )
            hospital_instance = temp_data["hospital"]
        else:
            raise RequiredFieldError("hospital")

        # Resolve ContentType
        content_type_id = price_data.pop("content_type", None)
        if content_type_id:
            try:
                content_type_instance = ContentType.objects.get(pk=content_type_id)
            except ContentType.DoesNotExist as err:
                raise NotFoundError("ContentType", content_type_id) from err
        else:
            raise RequiredFieldError("content_type")

        try:
            return HospitalItemPrice.objects.create(
                hospital=hospital_instance,
                content_type=content_type_instance,
                **price_data
            )
        except ValidationError as e:
            cls._handle_validation_error(e)
        except IntegrityError as e:
            cls._handle_integrity_error(e)

    @classmethod
    def hospital_item_price_update(cls, *, price_id: str, update_data: dict, user=None) -> HospitalItemPrice:
        """
        Update an existing hospital item price with validation.
        
        Args:
            price_id: ID of the price to update
            update_data: Dictionary containing fields to update
            user: User performing the update (for audit trail)
            
        Returns:
            HospitalItemPrice: The updated price instance
        """
        # Get price using base method
        instance = cls._get_entity(price_id)

        # Filter fields if allowed_fields is defined
        if cls.allowed_fields is not None:
            update_data = cls._filter_model_fields(update_data, cls.allowed_fields)

        # Merge with existing data for validation
        merged_data = {}
        for field in cls.allowed_fields:
            if hasattr(instance, field):
                merged_data[field] = getattr(instance, field)
        merged_data.update(update_data)
        
        # Apply validation rules
        cls._apply_validation_rules(merged_data, entity=instance)

        # Resolve hospital FK using base method if being updated
        if "hospital" in update_data:
            hospital_id = update_data.pop("hospital")
            temp_data = {"hospital": hospital_id}
            cls._resolve_foreign_key(
                temp_data, "hospital", Hospital, "Hospital", validate_active=True
            )
            instance.hospital = temp_data["hospital"]

        # Handle content_type (ContentType is not a regular model, so handle manually)
        if "content_type" in update_data:
            content_type_id = update_data.pop("content_type")
            try:
                instance.content_type = ContentType.objects.get(pk=content_type_id)
            except ContentType.DoesNotExist as err:
                raise NotFoundError("ContentType", content_type_id) from err

        # Update remaining fields
        for field, value in update_data.items():
            setattr(instance, field, value)

        try:
            instance.save(update_fields=None)
            return instance
        except ValidationError as e:
            cls._handle_validation_error(e)
        except IntegrityError as e:
            cls._handle_integrity_error(e)

    @classmethod
    def hospital_item_price_deactivate(cls, *, price_id: str, user=None) -> None:
        """Deactivate hospital item price using base method."""
        return cls.deactivate(entity_id=price_id, user=user, soft_delete=True)
