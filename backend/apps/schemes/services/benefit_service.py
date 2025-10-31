import csv
from io import StringIO

from django.core.exceptions import ValidationError
from django.db import transaction, IntegrityError

from apps.core.enums.choices import BusinessStatusChoices
from apps.core.exceptions.service_errors import (
    RequiredFieldError,
    NotFoundError,
    DuplicateError,
    InvalidValueError,
)
from apps.schemes.models import Benefit


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


class BenefitService:
    """
    Benefit business logic for write operations.
    Handles all benefit-related write operations including CRUD, validation,
    and business logic. Read operations are handled by selectors.
    """

    # ---------------------------------------------------------------------
    # Basic CRUD Operations
    # ---------------------------------------------------------------------

    @staticmethod
    @transaction.atomic
    def benefit_create(*, benefit_data: dict, user=None):
        """
        Create a new benefit with validation and duplicate checking.

        Args:
            benefit_data: Dictionary containing benefit information
            user: User creating the benefit (for audit trail)

        Returns:
            Benefit: The created benefit instance

        Raises:
            ValidationError: If data is invalid or duplicates exist
        """
        # Validate required fields
        required_fields = ["benefit_name", "in_or_out_patient"]
        for field in required_fields:
            if not benefit_data.get(field):
                raise RequiredFieldError(field)

        # Benefit name validation
        benefit_name = benefit_data.get("benefit_name", "").strip()
        if len(benefit_name) < 2:
            raise InvalidValueError("benefit_name", "Benefit name must be at least 2 characters long")
        if len(benefit_name) > 255:
            raise InvalidValueError("benefit_name", "Benefit name cannot exceed 255 characters")
        # Persist the trimmed value
        benefit_data["benefit_name"] = benefit_name

        # Description validation
        if benefit_data.get("description") and len(benefit_data["description"]) > 500:
            raise InvalidValueError("description", "Description cannot exceed 500 characters")

        # Patient type validation
        valid_patient_types = ["INPATIENT", "OUTPATIENT", "BOTH"]
        if benefit_data.get("in_or_out_patient") not in valid_patient_types:
            raise InvalidValueError("in_or_out_patient", "Invalid patient type")

        # Limit amount validation
        limit_amount = benefit_data.get("limit_amount")
        if limit_amount == "":
            benefit_data["limit_amount"] = None
        elif limit_amount is not None and limit_amount < 0:
            raise InvalidValueError("limit_amount", "Limit amount cannot be negative")

        # Handle plan field conversion
        if 'plan' in benefit_data and benefit_data['plan']:
            from apps.schemes.models import Plan
            try:
                plan = Plan.objects.get(id=benefit_data['plan'], is_deleted=False)
                benefit_data['plan'] = plan
            except Plan.DoesNotExist as exc:
                raise NotFoundError("Plan", benefit_data['plan']) from exc
        elif 'plan' in benefit_data and benefit_data['plan'] is None:
            benefit_data['plan'] = None

        # Create benefit - database unique constraints prevent duplicates atomically
        try:
            benefit = Benefit.objects.create(**benefit_data)
            return benefit
        except ValidationError as e:
            # Check if this is a uniqueness validation error, otherwise re-raise
            if hasattr(e, 'message_dict'):
                for field, messages in e.message_dict.items():
                    if any('already exists' in str(msg).lower() for msg in messages):
                        raise DuplicateError("Benefit", [field], f"Benefit with this {field} already exists") from e
            # Not a uniqueness error - re-raise original ValidationError
            raise
        except IntegrityError as e:
            # Database constraint violation - only raise DuplicateError for unique violations
            if _is_unique_constraint_violation(e):
                # Check for specific benefit-related unique constraint
                error_msg = str(e).lower()
                if 'benefit_name' in error_msg or 'unique' in error_msg:
                    raise DuplicateError("Benefit", ["benefit_name", "in_or_out_patient"], "Benefit with this name and patient type already exists") from e
                else:
                    raise DuplicateError("Benefit", message="Benefit with duplicate unique field already exists") from e
            else:
                # Other integrity errors (NOT NULL, FK, etc.) - raise InvalidValueError
                raise InvalidValueError(
                    field=[],
                    message="Database constraint violation",
                    details={"error": str(e)}
                ) from e

    @staticmethod
    @transaction.atomic
    def benefit_update(*, benefit_id: str, update_data: dict, user=None):
        """
        Update benefit with validation and duplicate checking.

        Args:
            benefit_id: ID of the benefit to update
            update_data: Dictionary containing fields to update
            user: User performing the update (for audit trail)

        Returns:
            Benefit: The updated benefit instance

        Raises:
            ValidationError: If data is invalid or duplicates exist
        """
        try:
            benefit = Benefit.objects.get(id=benefit_id, is_deleted=False)
        except Benefit.DoesNotExist as exc:
            raise NotFoundError("Benefit", benefit_id) from exc

        # Validate data
        if "benefit_name" in update_data:
            benefit_name = update_data["benefit_name"].strip()
            if len(benefit_name) < 2:
                raise InvalidValueError("benefit_name", "Benefit name must be at least 2 characters long")
            if len(benefit_name) > 255:
                raise InvalidValueError("benefit_name", "Benefit name cannot exceed 255 characters")
            # Persist the trimmed value
            update_data["benefit_name"] = benefit_name

        if (
            "description" in update_data
            and update_data["description"]
            and len(update_data["description"]) > 500
        ):
            raise InvalidValueError("description", "Description cannot exceed 500 characters")

        if "in_or_out_patient" in update_data:
            valid_patient_types = ["INPATIENT", "OUTPATIENT", "BOTH"]
            if update_data["in_or_out_patient"] not in valid_patient_types:
                raise InvalidValueError("in_or_out_patient", "Invalid patient type")

        if "limit_amount" in update_data and isinstance(update_data["limit_amount"], str) and update_data["limit_amount"].strip() == "":
            update_data["limit_amount"] = None
        if "limit_amount" in update_data:
            limit_amount = update_data["limit_amount"]
            if limit_amount is not None and limit_amount < 0:
                raise InvalidValueError("limit_amount", "Limit amount cannot be negative")

        # Handle plan field conversion
        if 'plan' in update_data:
            if update_data['plan']:
                from apps.schemes.models import Plan
                try:
                    plan = Plan.objects.get(id=update_data['plan'], is_deleted=False)
                    update_data['plan'] = plan
                except Plan.DoesNotExist as exc:
                    raise NotFoundError("Plan", update_data['plan']) from exc
            else:
                update_data['plan'] = None

        # Update fields
        for field, value in update_data.items():
            setattr(benefit, field, value)

        # Save - database constraints will prevent duplicates atomically
        try:
            benefit.save()
            return benefit
        except ValidationError as e:
            # Check if this is a uniqueness validation error, otherwise re-raise
            if hasattr(e, 'message_dict'):
                for field, messages in e.message_dict.items():
                    if any('already exists' in str(msg).lower() for msg in messages):
                        raise DuplicateError("Benefit", [field], f"Another benefit with this {field} already exists") from e
            # Not a uniqueness error - re-raise original ValidationError
            raise
        except IntegrityError as e:
            # Database constraint violation - only raise DuplicateError for unique violations
            if _is_unique_constraint_violation(e):
                # Check for specific benefit-related unique constraint
                error_msg = str(e).lower()
                if 'benefit_name' in error_msg or 'unique' in error_msg:
                    raise DuplicateError("Benefit", ["benefit_name", "in_or_out_patient"], "Another benefit with this name and patient type already exists") from e
                else:
                    raise DuplicateError("Benefit", message="Benefit with duplicate unique field already exists") from e
            else:
                # Other integrity errors (NOT NULL, FK, etc.) - raise InvalidValueError
                raise InvalidValueError(
                    field=[],
                    message="Database constraint violation",
                    details={"error": str(e)}
                ) from e

    # ---------------------------------------------------------------------
    # Status Management
    # ---------------------------------------------------------------------

    @staticmethod
    @transaction.atomic
    def benefit_activate(*, benefit_id: str, user=None):
        """
        Reactivate a previously deactivated benefit.

        Args:
            benefit_id: ID of the benefit to activate
            user: User performing the activation

        Returns:
            Benefit: The activated benefit instance
        """
        try:
            benefit = Benefit.objects.get(id=benefit_id, is_deleted=False)
        except Benefit.DoesNotExist as exc:
            raise NotFoundError("Benefit", benefit_id) from exc

        benefit.status = BusinessStatusChoices.ACTIVE
        benefit.is_deleted = False
        benefit.deleted_at = None
        benefit.deleted_by = None
        benefit.save(update_fields=["status", "is_deleted", "deleted_at", "deleted_by"])
        return benefit

    @staticmethod
    @transaction.atomic
    def benefit_deactivate(*, benefit_id: str, user=None):
        """
        Soft delete / deactivate benefit.

        Args:
            benefit_id: ID of the benefit to deactivate
            user: User performing the deactivation

        Returns:
            Benefit: The deactivated benefit instance
        """
        try:
            benefit = Benefit.objects.get(id=benefit_id, is_deleted=False)
        except Benefit.DoesNotExist as exc:
            raise NotFoundError("Benefit", benefit_id) from exc

        benefit.status = BusinessStatusChoices.INACTIVE
        benefit.is_deleted = True
        benefit.save(update_fields=["status", "is_deleted"])
        return benefit

    @staticmethod
    @transaction.atomic
    def benefit_suspend(*, benefit_id: str, reason: str, user=None):
        """
        Suspend a benefit with reason tracking.

        Args:
            benefit_id: ID of the benefit to suspend
            reason: Reason for suspension
            user: User performing the suspension

        Returns:
            Benefit: The suspended benefit instance
        """
        try:
            benefit = Benefit.objects.get(id=benefit_id, is_deleted=False)
        except Benefit.DoesNotExist as exc:
            raise NotFoundError("Benefit", benefit_id) from exc

        benefit.status = BusinessStatusChoices.SUSPENDED
        benefit.save(update_fields=["status"])
        return benefit

    # ---------------------------------------------------------------------
    # Bulk Operations
    # ---------------------------------------------------------------------

    @staticmethod
    @transaction.atomic
    def benefits_bulk_status_update(*, benefit_ids: list, new_status: str, user=None):
        """
        Bulk update benefit status.

        Args:
            benefit_ids: List of benefit IDs to update
            new_status: New status to set
            user: User performing the update

        Returns:
            int: Number of benefits updated
        """
        if new_status not in [choice[0] for choice in BusinessStatusChoices.choices]:
            raise InvalidValueError("status", "Invalid status value")

        updated_count = Benefit.objects.filter(
            id__in=benefit_ids, is_deleted=False
        ).update(status=new_status)

        return updated_count

    @staticmethod
    def benefits_export_csv(*, filters: dict = None):
        """
        Export filtered benefits to CSV format.

        Args:
            filters: Optional filters to apply

        Returns:
            str: CSV content as string
        """
        from apps.schemes.selectors import benefit_list

        if filters:
            benefits = benefit_list(filters=filters)
        else:
            benefits = Benefit.objects.filter(is_deleted=False)

        output = StringIO()
        writer = csv.writer(output)

        # Write header
        writer.writerow(
            [
                "ID",
                "Benefit Name",
                "Description",
                "Patient Type",
                "Limit Amount",
                "Status",
                "Created At",
                "Updated At",
            ]
        )

        # Write data
        for benefit in benefits:
            writer.writerow(
                [
                    benefit.id,
                    benefit.benefit_name,
                    benefit.description or "",
                    benefit.in_or_out_patient,
                    benefit.limit_amount or "",
                    benefit.status,
                    benefit.created_at.strftime("%Y-%m-%d %H:%M:%S"),
                    benefit.updated_at.strftime("%Y-%m-%d %H:%M:%S"),
                ]
            )

        return output.getvalue()
