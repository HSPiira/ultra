from typing import Any, Optional
import csv
from io import StringIO

from django.core.exceptions import ValidationError
from django.db import transaction

from apps.core.enums.choices import BusinessStatusChoices
from apps.core.exceptions.service_errors import NotFoundError, InactiveEntityError, RequiredFieldError
from apps.core.services import (
    BaseService,
    CSVExportMixin,
    RequiredFieldsRule,
)
from apps.core.utils.validation import validate_required_fields, validate_positive_amount, validate_percentage
from apps.schemes.models import SchemeItem


class SchemeItemService(BaseService, CSVExportMixin):
    """
    Scheme Item business logic for write operations.
    Handles all scheme item-related write operations including CRUD, validation,
    and business logic. Read operations are handled by selectors.
    
    Uses SOLID improvements:
    - Validation rules for extensible validation (OCP)
    - Standardized method signatures available (ISP)
    """
    
    # BaseService configuration
    entity_model = SchemeItem
    entity_name = "SchemeItem"
    unique_fields = []  # Composite unique constraint handled manually
    allowed_fields = {
        'scheme_period', 'content_type', 'object_id', 'limit_amount',
        'copayment_percent', 'status'
    }
    validation_rules = [
        RequiredFieldsRule(["scheme_period", "content_type", "object_id"], "SchemeItem"),
    ]

    # ---------------------------------------------------------------------
    # Basic CRUD Operations
    # ---------------------------------------------------------------------

    @classmethod
    @transaction.atomic
    def scheme_item_create(cls, *, scheme_item_data: dict, user: Optional[Any] = None):
        """
        Create a new scheme item with validation and duplicate checking.

        Args:
            scheme_item_data: Dictionary containing scheme item information
            user: User creating the scheme item (reserved for future audit trail implementation)
                TODO: Implement audit trail logging when user is provided (e.g., created_by field)

        Returns:
            SchemeItem: The created scheme item instance

        Raises:
            ValidationError: If data is invalid or duplicates exist
        """
        # Filter fields if allowed_fields is defined
        if cls.allowed_fields is not None:
            scheme_item_data = cls._filter_model_fields(scheme_item_data, cls.allowed_fields)
        
        # Apply validation rules (configured in BaseService)
        cls._apply_validation_rules(scheme_item_data)

        # Resolve scheme_period FK using base method
        from apps.schemes.models import SchemePeriod
        cls._resolve_foreign_key(
            scheme_item_data, "scheme_period", SchemePeriod, "SchemePeriod", validate_active=True
        )

        # Validate content object is active
        content_type = scheme_item_data.get("content_type")
        object_id = scheme_item_data.get("object_id")
        if content_type and object_id:
            model_class = content_type.model_class()
            if model_class:
                try:
                    content_obj = model_class.objects.get(pk=object_id)
                    if hasattr(content_obj, 'status') and hasattr(content_obj, 'is_deleted'):
                        if content_obj.status != BusinessStatusChoices.ACTIVE or content_obj.is_deleted:
                            model_name = model_class.__name__
                            raise ValidationError(f"{model_name} must be active to create a scheme item")
                except model_class.DoesNotExist:
                    raise ValidationError(f"Content object with id '{object_id}' does not exist")

        # Limit amount validation using utility
        if scheme_item_data.get("limit_amount") is not None:
            validate_positive_amount(
                scheme_item_data["limit_amount"], "limit_amount", allow_none=True, allow_zero=True
            )

        # Copayment validation using utility
        if scheme_item_data.get("copayment_percent") is not None:
            validate_percentage(
                scheme_item_data["copayment_percent"], "copayment_percent", allow_none=True
            )

        # Check for duplicates (unique together: scheme_period, content_type, object_id)
        qs = SchemeItem.objects.filter(is_deleted=False)
        if qs.filter(
            scheme_period=scheme_item_data.get("scheme_period"),
            content_type=scheme_item_data.get("content_type"),
            object_id=scheme_item_data.get("object_id"),
        ).exists():
            raise ValidationError("Scheme item with this combination already exists for this period")

        # Create scheme item
        scheme_item = SchemeItem.objects.create(**scheme_item_data)
        return scheme_item

    @classmethod
    @transaction.atomic
    def scheme_item_update(cls, *, scheme_item_id: str, update_data: dict, user=None):
        """
        Update scheme item with validation and duplicate checking.

        Args:
            scheme_item_id: ID of the scheme item to update
            update_data: Dictionary containing fields to update
            user: User performing the update (for audit trail)

        Returns:
            SchemeItem: The updated scheme item instance

        Raises:
            ValidationError: If data is invalid or duplicates exist
        """
        # Get scheme item using base method
        scheme_item = cls._get_entity(scheme_item_id)
        
        # Filter fields if allowed_fields is defined
        if cls.allowed_fields is not None:
            update_data = cls._filter_model_fields(update_data, cls.allowed_fields)
        
        # Merge with existing data for validation
        merged_data = {}
        for field in cls.allowed_fields:
            if hasattr(scheme_item, field):
                merged_data[field] = getattr(scheme_item, field)
        merged_data.update(update_data)
        
        # Apply validation rules (configured in BaseService)
        cls._apply_validation_rules(merged_data, entity=scheme_item)

        # Validate data using utilities
        if "limit_amount" in update_data and update_data["limit_amount"] is not None:
            validate_positive_amount(
                update_data["limit_amount"], "limit_amount", allow_none=True, allow_zero=True
            )

        if "copayment_percent" in update_data and update_data["copayment_percent"] is not None:
            validate_percentage(
                update_data["copayment_percent"], "copayment_percent", allow_none=True
            )

        # Resolve scheme_period FK using base method if being updated
        if "scheme_period" in update_data:
            from apps.schemes.models import SchemePeriod
            cls._resolve_foreign_key(
                update_data, "scheme_period", SchemePeriod, "SchemePeriod", validate_active=True
            )

        # Validate content object is active if being updated
        content_type = update_data.get("content_type", scheme_item.content_type)
        object_id = update_data.get("object_id", scheme_item.object_id)
        if content_type and object_id:
            model_class = content_type.model_class()
            if model_class:
                try:
                    content_obj = model_class.objects.get(pk=object_id)
                    if hasattr(content_obj, 'status') and hasattr(content_obj, 'is_deleted'):
                        if content_obj.status != BusinessStatusChoices.ACTIVE or content_obj.is_deleted:
                            model_name = model_class.__name__
                            raise ValidationError(f"{model_name} must be active to update a scheme item")
                except model_class.DoesNotExist:
                    raise ValidationError(f"Content object with id '{object_id}' does not exist")

        # Check for duplicates (excluding current scheme item)
        if (
            "scheme_period" in update_data
            or "content_type" in update_data
            or "object_id" in update_data
        ):
            qs = SchemeItem.objects.filter(is_deleted=False).exclude(id=scheme_item_id)
            scheme_period = update_data.get("scheme_period", scheme_item.scheme_period)
            content_type = update_data.get("content_type", scheme_item.content_type)
            object_id = update_data.get("object_id", scheme_item.object_id)
            if qs.filter(
                scheme_period=scheme_period, content_type=content_type, object_id=object_id
            ).exists():
                raise ValidationError(
                    "Another scheme item with this combination already exists for this period"
                )

        # Update fields
        for field, value in update_data.items():
            setattr(scheme_item, field, value)

        scheme_item.save()
        return scheme_item

    # ---------------------------------------------------------------------
    # Status Management
    # ---------------------------------------------------------------------

    @classmethod
    @transaction.atomic
    def scheme_item_activate(cls, *, scheme_item_id: str, user=None):
        """
        Reactivate a previously deactivated scheme item.

        Args:
            scheme_item_id: ID of the scheme item to activate
            user: User performing the activation

        Returns:
            SchemeItem: The activated scheme item instance
        """
        return cls.activate(entity_id=scheme_item_id, user=user)

    @classmethod
    @transaction.atomic
    def scheme_item_deactivate(cls, *, scheme_item_id: str, user=None):
        """
        Soft delete / deactivate scheme item.

        Args:
            scheme_item_id: ID of the scheme item to deactivate
            user: User performing the deactivation

        Returns:
            SchemeItem: The deactivated scheme item instance
        """
        return cls.deactivate(entity_id=scheme_item_id, user=user, soft_delete=True)

    @classmethod
    @transaction.atomic
    def scheme_item_suspend(cls, *, scheme_item_id: str, reason: str, user=None):
        """
        Suspend a scheme item with reason tracking.

        Args:
            scheme_item_id: ID of the scheme item to suspend
            reason: Reason for suspension
            user: User performing the suspension

        Returns:
            SchemeItem: The suspended scheme item instance
        """
        return cls.suspend(entity_id=scheme_item_id, reason=reason, user=user)

    # ---------------------------------------------------------------------
    # Bulk Operations
    # ---------------------------------------------------------------------

    @staticmethod
    @transaction.atomic
    def scheme_items_bulk_status_update(
        *, scheme_item_ids: list, new_status: str, user=None
    ):
        """
        Bulk update scheme item status.

        Args:
            scheme_item_ids: List of scheme item IDs to update
            new_status: New status to set
            user: User performing the update

        Returns:
            int: Number of scheme items updated
        """
        return SchemeItemService.bulk_status_update(entity_ids=scheme_item_ids, new_status=new_status, user=user)

    @staticmethod
    @transaction.atomic
    def scheme_items_bulk_create(*, scheme_period_id: str, assignments: list, user=None):
        """
        Bulk create scheme items for a specific scheme period.

        Args:
            scheme_period_id: ID of the scheme period to assign items to
            assignments: List of assignment dictionaries with content_type, object_id, limit_amount, copayment_percent
            user: User performing the bulk assignment

        Returns:
            list: List of created scheme items

        Raises:
            ValidationError: If data is invalid or duplicates exist
        """
        from apps.schemes.models import SchemePeriod

        # Validate scheme period exists
        try:
            scheme_period = SchemePeriod.objects.get(id=scheme_period_id, is_deleted=False)
        except SchemePeriod.DoesNotExist as e:
            raise ValidationError("Scheme period not found") from e

        created_items = []
        errors = []

        for i, assignment in enumerate(assignments):
            try:
                # Get ContentType instance with proper error handling
                from django.contrib.contenttypes.models import ContentType
                try:
                    content_type = ContentType.objects.get(id=assignment.get("content_type"))
                except (ContentType.DoesNotExist, ValueError) as e:
                    errors.append(f"Assignment {i+1}: Invalid content_type '{assignment.get('content_type')}': {str(e)}")
                    continue
                
                # Verify the target object exists
                model_class = content_type.model_class()
                object_id = assignment.get("object_id")
                if not model_class.objects.filter(pk=object_id).exists():
                    errors.append(f"Assignment {i+1}: Object with id '{object_id}' does not exist for content_type '{content_type.app_label}.{content_type.model}'")
                    continue
                
                # Check if item is already assigned but soft-deleted
                existing_item = SchemeItem.objects.filter(
                    scheme_period=scheme_period,
                    content_type=content_type,
                    object_id=object_id
                ).first()

                if existing_item and existing_item.is_deleted:
                    # Validate data before restoring
                    limit_amount = assignment.get("limit_amount")
                    copayment_percent = assignment.get("copayment_percent")
                    
                    # Apply same validation as scheme_item_create
                    if limit_amount is not None and limit_amount < 0:
                        errors.append(f"Assignment {i+1}: Limit amount cannot be negative")
                        continue
                    
                    if copayment_percent is not None:
                        if copayment_percent < 0:
                            errors.append(f"Assignment {i+1}: Copayment percentage cannot be negative")
                            continue
                        if copayment_percent > 100:
                            errors.append(f"Assignment {i+1}: Copayment percentage cannot exceed 100")
                            continue
                    
                    # Restore the soft-deleted item with validated data
                    existing_item.is_deleted = False
                    existing_item.status = BusinessStatusChoices.ACTIVE
                    existing_item.limit_amount = limit_amount
                    existing_item.copayment_percent = copayment_percent
                    existing_item.save()
                    created_items.append(existing_item)
                else:
                    # Create new scheme item
                    scheme_item_data = {
                        "scheme_period": scheme_period,
                        "content_type": content_type,
                        "object_id": object_id,
                        "limit_amount": assignment.get("limit_amount"),
                        "copayment_percent": assignment.get("copayment_percent"),
                    }

                    scheme_item = SchemeItemService.scheme_item_create(
                        scheme_item_data=scheme_item_data, user=user
                    )
                    created_items.append(scheme_item)

            except ValidationError as e:
                errors.append(f"Assignment {i+1}: {str(e)}")

        if errors:
            raise ValidationError(f"Bulk assignment failed: {'; '.join(errors)}")

        return created_items

    @staticmethod
    @transaction.atomic
    def scheme_items_bulk_remove(*, scheme_item_ids: list, user=None):
        """
        Bulk remove scheme items by deactivating them.

        Args:
            scheme_item_ids: List of scheme item IDs to remove
            user: User performing the removal

        Returns:
            int: Number of scheme items removed
        """
        removed_count = 0
        for scheme_item_id in scheme_item_ids:
            try:
                SchemeItemService.scheme_item_deactivate(
                    scheme_item_id=scheme_item_id, user=user
                )
                removed_count += 1
            except ValidationError:
                # Skip invalid IDs
                continue

        return removed_count

    @staticmethod
    @transaction.atomic
    def scheme_items_copy_from_period(
        *,
        source_period_id: str,
        target_period_id: str,
        item_modifications: dict = None,
        filter_content_types: list = None,
        exclude_object_ids: list = None,
        user=None,
    ) -> list:
        """
        Copy items from one period to another.

        Args:
            source_period_id: Period to copy items from
            target_period_id: Period to copy items to
            item_modifications: Optional dict of field changes to apply
                e.g., {"copayment_percent": Decimal("15.00")}
            filter_content_types: Only copy items with these content types
            exclude_object_ids: Exclude items with these object IDs
            user: User performing the operation

        Returns:
            List of created SchemeItem instances

        Raises:
            ValidationError: If periods don't exist
        """
        from apps.schemes.models import SchemePeriod

        # Get periods
        try:
            source_period = SchemePeriod.objects.get(
                id=source_period_id, is_deleted=False
            )
            target_period = SchemePeriod.objects.get(
                id=target_period_id, is_deleted=False
            )
        except SchemePeriod.DoesNotExist as e:
            raise ValidationError("Source or target period not found") from e

        # Get items to copy
        items = SchemeItem.objects.filter(
            scheme_period=source_period, is_deleted=False
        )

        # Apply filters
        if filter_content_types:
            items = items.filter(content_type__in=filter_content_types)

        if exclude_object_ids:
            items = items.exclude(object_id__in=exclude_object_ids)

        # Copy items
        created_items = []
        for old_item in items:
            new_item_data = {
                "scheme_period": target_period,
                "content_type": old_item.content_type,
                "object_id": old_item.object_id,
                "limit_amount": old_item.limit_amount,
                "copayment_percent": old_item.copayment_percent,
                "status": old_item.status,
            }

            # Apply modifications if provided
            if item_modifications:
                for field, value in item_modifications.items():
                    if field in new_item_data and field != "scheme_period":
                        new_item_data[field] = value

            try:
                new_item = SchemeItem.objects.create(**new_item_data)
                created_items.append(new_item)
            except Exception:
                # Skip duplicates or errors
                continue

        return created_items

    @staticmethod
    def scheme_items_export_csv(*, filters: dict = None):
        """
        Export filtered scheme items to CSV format.

        Args:
            filters: Optional filters to apply

        Returns:
            str: CSV content as string

        Note:
            Optimized with select_related to prevent N+1 queries when accessing
            scheme_period.scheme in the CSV export loop.
        """
        from apps.schemes.selectors import scheme_item_list

        if filters:
            scheme_items = scheme_item_list(filters=filters)
        else:
            scheme_items = SchemeItem.objects.select_related(
                "scheme_period__scheme", "content_type"
            ).filter(is_deleted=False)

        output = StringIO()
        writer = csv.writer(output)

        # Write header
        writer.writerow(
            [
                "ID",
                "Scheme",
                "Period Number",
                "Content Type",
                "Object ID",
                "Item Name",
                "Limit Amount",
                "Copayment Percent",
                "Status",
                "Created At",
                "Updated At",
            ]
        )

        # Write data
        for scheme_item in scheme_items:
            writer.writerow(
                [
                    scheme_item.id,
                    scheme_item.scheme_period.scheme.scheme_name if scheme_item.scheme_period else "",
                    scheme_item.scheme_period.period_number if scheme_item.scheme_period else "",
                    scheme_item.content_type.model if scheme_item.content_type else "",
                    scheme_item.object_id,
                    str(scheme_item.item) if scheme_item.item else "",
                    scheme_item.limit_amount or "",
                    scheme_item.copayment_percent or "",
                    scheme_item.status,
                    scheme_item.created_at.strftime("%Y-%m-%d %H:%M:%S"),
                    scheme_item.updated_at.strftime("%Y-%m-%d %H:%M:%S"),
                ]
            )

        return output.getvalue()
