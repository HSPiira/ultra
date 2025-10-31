from django.contrib.contenttypes.models import ContentType
from django.core.exceptions import ValidationError
from django.db import IntegrityError

from apps.core.exceptions.service_errors import NotFoundError, DuplicateError, InvalidValueError
from apps.medical_catalog.models import HospitalItemPrice
from apps.providers.models import Hospital


def _is_unique_constraint_violation(error: IntegrityError) -> bool:
    """
    Determine if an IntegrityError is a unique constraint violation.
    
    Checks database-specific error codes and constraint names to positively
    identify unique constraint violations, avoiding false positives from
    NOT NULL, foreign key, or other constraint violations.
    """
    # Check for PostgreSQL unique violation (pgcode 23505)
    if hasattr(error, 'orig') and hasattr(error.orig, 'pgcode'):
        if error.orig.pgcode == '23505':  # unique_violation
            return True
    
    # Check constraint name for uniqueness indicators
    if hasattr(error, 'orig'):
        error_str = str(error).lower()
        constraint_name = None
        
        # Try to extract constraint name from PostgreSQL diagnostic info
        if hasattr(error.orig, 'diag') and hasattr(error.orig.diag, 'constraint_name'):
            constraint_name = error.orig.diag.constraint_name.lower()
        
        # Check extracted constraint name for uniqueness indicators
        if constraint_name:
            if any(indicator in constraint_name for indicator in ['unique', '_pk', 'primary']):
                return True
        
        # Fallback: check error string for constraint-related uniqueness patterns
        if 'constraint' in error_str:
            if any(indicator in error_str for indicator in ['unique', '_pk', 'primary key']):
                return True
    
    # Last resort: check error message for unique violation patterns
    # Only trust this if we see specific unique violation language
    error_msg = str(error).lower()
    unique_patterns = [
        'duplicate key value violates unique constraint',
        'unique constraint',
        'duplicate entry',
        'already exists',
    ]
    if any(pattern in error_msg for pattern in unique_patterns):
        # Double-check it's not another constraint type
        if 'not null' not in error_msg and 'foreign key' not in error_msg:
            return True
    
    return False


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
        except Hospital.DoesNotExist as err:
            raise NotFoundError("Hospital", hospital_id) from err

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
            # Check if this is a uniqueness validation error, otherwise re-raise
            if hasattr(e, 'message_dict'):
                for field, messages in e.message_dict.items():
                    if any('already exists' in str(msg).lower() for msg in messages):
                        raise DuplicateError("HospitalItemPrice", [field], f"HospitalItemPrice with this {field} already exists") from e
            # Not a uniqueness error - re-raise original ValidationError
            raise
        except IntegrityError as e:
            # Database constraint violation - only raise DuplicateError for unique violations
            if _is_unique_constraint_violation(e):
                raise DuplicateError("HospitalItemPrice", message="HospitalItemPrice with these values already exists") from e
            else:
                # Other integrity errors (NOT NULL, FK, etc.) - raise InvalidValueError
                raise InvalidValueError(
                    field="database",
                    message="Database constraint violation",
                    details={"error": str(e)}
                ) from e

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
            if _is_unique_constraint_violation(e):
                raise DuplicateError("HospitalItemPrice", message="Another hospitalitemprice with these values already exists") from e
            else:
                # Other integrity errors (NOT NULL, FK, etc.) - raise InvalidValueError
                raise InvalidValueError(
                    field=[],
                    message="Database constraint violation",
                    details={"error": str(e)}
                ) from e

    @staticmethod
    def deactivate(*, price_id: str, user=None) -> None:
        try:
            instance = HospitalItemPrice.objects.get(pk=price_id, is_deleted=False)
        except HospitalItemPrice.DoesNotExist:
            raise NotFoundError("HospitalItemPrice", price_id) from None

        instance.soft_delete(user=user)
        instance.save(update_fields=["is_deleted", "deleted_at", "deleted_by"])
