import csv
from io import StringIO

from django.core.exceptions import ValidationError
from django.db import transaction

from apps.core.enums.choices import BusinessStatusChoices
from apps.schemes.models import SchemeItem


class SchemeItemService:
    """
    Scheme Item business logic for write operations.
    Handles all scheme item-related write operations including CRUD, validation,
    and business logic. Read operations are handled by selectors.
    """

    # ---------------------------------------------------------------------
    # Basic CRUD Operations
    # ---------------------------------------------------------------------

    @staticmethod
    @transaction.atomic
    def scheme_item_create(*, scheme_item_data: dict, user=None):
        """
        Create a new scheme item with validation and duplicate checking.

        Args:
            scheme_item_data: Dictionary containing scheme item information
            user: User creating the scheme item (for audit trail)

        Returns:
            SchemeItem: The created scheme item instance

        Raises:
            ValidationError: If data is invalid or duplicates exist
        """
        # Validate data
        required_fields = ["scheme", "content_type", "object_id"]
        for field in required_fields:
            if not scheme_item_data.get(field):
                raise ValidationError(f"{field} is required")

        # Limit amount validation
        if (
            scheme_item_data.get("limit_amount") is not None
            and scheme_item_data["limit_amount"] < 0
        ):
            raise ValidationError("Limit amount cannot be negative")

        # Copayment validation
        copayment = scheme_item_data.get("copayment_percent")
        if copayment is not None:
            if copayment < 0:
                raise ValidationError("Copayment percentage cannot be negative")
            if copayment > 100:
                raise ValidationError("Copayment percentage cannot exceed 100")

        # Check for duplicates (unique together: scheme, content_type, object_id)
        qs = SchemeItem.objects.filter(is_deleted=False)
        if qs.filter(
            scheme=scheme_item_data.get("scheme"),
            content_type=scheme_item_data.get("content_type"),
            object_id=scheme_item_data.get("object_id"),
        ).exists():
            raise ValidationError("Scheme item with this combination already exists")

        # Create scheme item
        scheme_item = SchemeItem.objects.create(**scheme_item_data)
        return scheme_item

    @staticmethod
    @transaction.atomic
    def scheme_item_update(*, scheme_item_id: str, update_data: dict, user=None):
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
        try:
            scheme_item = SchemeItem.objects.get(id=scheme_item_id, is_deleted=False)
        except SchemeItem.DoesNotExist as e:
            raise ValidationError("Scheme item not found") from e

        # Validate data
        if (
            "limit_amount" in update_data
            and update_data["limit_amount"] is not None
            and update_data["limit_amount"] < 0
        ):
            raise ValidationError("Limit amount cannot be negative")

        if (
            "copayment_percent" in update_data
            and update_data["copayment_percent"] is not None
        ):
            copayment = update_data["copayment_percent"]
            if copayment < 0:
                raise ValidationError("Copayment percentage cannot be negative")
            if copayment > 100:
                raise ValidationError("Copayment percentage cannot exceed 100")

        # Check for duplicates (excluding current scheme item)
        if (
            "scheme" in update_data
            or "content_type" in update_data
            or "object_id" in update_data
        ):
            qs = SchemeItem.objects.filter(is_deleted=False).exclude(id=scheme_item_id)
            scheme = update_data.get("scheme", scheme_item.scheme)
            content_type = update_data.get("content_type", scheme_item.content_type)
            object_id = update_data.get("object_id", scheme_item.object_id)
            if qs.filter(
                scheme=scheme, content_type=content_type, object_id=object_id
            ).exists():
                raise ValidationError(
                    "Another scheme item with this combination already exists"
                )

        # Update fields
        for field, value in update_data.items():
            setattr(scheme_item, field, value)

        scheme_item.save()
        return scheme_item

    # ---------------------------------------------------------------------
    # Status Management
    # ---------------------------------------------------------------------

    @staticmethod
    @transaction.atomic
    def scheme_item_activate(*, scheme_item_id: str, user=None):
        """
        Reactivate a previously deactivated scheme item.

        Args:
            scheme_item_id: ID of the scheme item to activate
            user: User performing the activation

        Returns:
            SchemeItem: The activated scheme item instance
        """
        try:
            scheme_item = SchemeItem.objects.get(id=scheme_item_id, is_deleted=False)
        except SchemeItem.DoesNotExist as e:
            raise ValidationError("Scheme item not found") from e

        scheme_item.status = BusinessStatusChoices.ACTIVE
        scheme_item.is_deleted = False
        scheme_item.deleted_at = None
        scheme_item.deleted_by = None
        scheme_item.save(
            update_fields=["status", "is_deleted", "deleted_at", "deleted_by"]
        )
        return scheme_item

    @staticmethod
    @transaction.atomic
    def scheme_item_deactivate(*, scheme_item_id: str, user=None):
        """
        Soft delete / deactivate scheme item.

        Args:
            scheme_item_id: ID of the scheme item to deactivate
            user: User performing the deactivation

        Returns:
            SchemeItem: The deactivated scheme item instance
        """
        try:
            scheme_item = SchemeItem.objects.get(id=scheme_item_id, is_deleted=False)
        except SchemeItem.DoesNotExist as e:
            raise ValidationError("Scheme item not found") from e

        scheme_item.status = BusinessStatusChoices.INACTIVE
        scheme_item.is_deleted = True
        scheme_item.save(update_fields=["status", "is_deleted"])
        return scheme_item

    @staticmethod
    @transaction.atomic
    def scheme_item_suspend(*, scheme_item_id: str, reason: str, user=None):
        """
        Suspend a scheme item with reason tracking.

        Args:
            scheme_item_id: ID of the scheme item to suspend
            reason: Reason for suspension
            user: User performing the suspension

        Returns:
            SchemeItem: The suspended scheme item instance
        """
        try:
            scheme_item = SchemeItem.objects.get(id=scheme_item_id, is_deleted=False)
        except SchemeItem.DoesNotExist as e:
            raise ValidationError("Scheme item not found") from e

        scheme_item.status = BusinessStatusChoices.SUSPENDED
        scheme_item.save(update_fields=["status"])
        return scheme_item

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
        if new_status not in [choice[0] for choice in BusinessStatusChoices.choices]:
            raise ValidationError("Invalid status")

        updated_count = SchemeItem.objects.filter(
            id__in=scheme_item_ids, is_deleted=False
        ).update(status=new_status)

        return updated_count

    @staticmethod
    @transaction.atomic
    def scheme_items_bulk_create(*, scheme_id: str, assignments: list, user=None):
        """
        Bulk create scheme items for a specific scheme.

        Args:
            scheme_id: ID of the scheme to assign items to
            assignments: List of assignment dictionaries with content_type, object_id, limit_amount, copayment_percent
            user: User performing the bulk assignment

        Returns:
            list: List of created scheme items

        Raises:
            ValidationError: If data is invalid or duplicates exist
        """
        from apps.schemes.models import Scheme

        # Validate scheme exists
        try:
            scheme = Scheme.objects.get(id=scheme_id, is_deleted=False)
        except Scheme.DoesNotExist as e:
            raise ValidationError("Scheme not found") from e

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
                    scheme=scheme,
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
                        "scheme": scheme,
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
    def scheme_items_export_csv(*, filters: dict = None):
        """
        Export filtered scheme items to CSV format.

        Args:
            filters: Optional filters to apply

        Returns:
            str: CSV content as string
        """
        from apps.schemes.selectors import scheme_item_list

        if filters:
            scheme_items = scheme_item_list(filters=filters)
        else:
            scheme_items = SchemeItem.objects.filter(is_deleted=False)

        output = StringIO()
        writer = csv.writer(output)

        # Write header
        writer.writerow(
            [
                "ID",
                "Scheme",
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
                    scheme_item.scheme.scheme_name if scheme_item.scheme else "",
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
