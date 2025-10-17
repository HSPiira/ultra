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
