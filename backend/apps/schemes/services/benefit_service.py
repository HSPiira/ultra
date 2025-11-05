from django.core.exceptions import ValidationError
from django.db import transaction, IntegrityError

from apps.core.enums.choices import BusinessStatusChoices
from apps.core.exceptions.service_errors import (
    RequiredFieldError,
    NotFoundError,
    DuplicateError,
    InvalidValueError,
)
from apps.core.services import BaseService, CSVExportMixin
from apps.core.utils.validation import validate_required_fields, validate_string_length, validate_choice_value
from apps.schemes.models import Benefit


class BenefitService(BaseService, CSVExportMixin):
    """
    Benefit business logic for write operations.
    Handles all benefit-related write operations including CRUD, validation,
    and business logic. Read operations are handled by selectors.
    """
    
    # BaseService configuration
    entity_model = Benefit
    entity_name = "Benefit"
    unique_fields = ["benefit_name"]
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
        # Validate required fields using base method
        BenefitService._validate_required_fields(benefit_data, ["benefit_name", "in_or_out_patient"])

        # Benefit name validation using utility
        benefit_name = benefit_data.get("benefit_name", "").strip()
        validate_string_length(benefit_name, "benefit_name", min_length=2, max_length=255)
        benefit_data["benefit_name"] = benefit_name  # Persist trimmed value

        # Description validation using utility
        if benefit_data.get("description"):
            validate_string_length(benefit_data["description"], "description", max_length=500, allow_none=True)

        # Patient type validation using utility
        valid_patient_types = ["INPATIENT", "OUTPATIENT", "BOTH"]
        validate_choice_value(benefit_data.get("in_or_out_patient"), valid_patient_types, "in_or_out_patient")

        # Limit amount validation
        limit_amount = benefit_data.get("limit_amount")
        if limit_amount == "":
            benefit_data["limit_amount"] = None
        elif limit_amount is not None:
            from apps.core.utils.validation import validate_positive_amount
            validate_positive_amount(limit_amount, "limit_amount", allow_none=True, allow_zero=True)

        # Resolve plan FK using base method
        if 'plan' in benefit_data and benefit_data['plan']:
            from apps.schemes.models import Plan
            BenefitService._resolve_foreign_key(
                benefit_data, "plan", Plan, "Plan", validate_active=True, allow_none=True
            )
        elif 'plan' in benefit_data and benefit_data['plan'] is None:
            benefit_data['plan'] = None

        # Create benefit - database unique constraints prevent duplicates atomically
        try:
            benefit = Benefit.objects.create(**benefit_data)
            return benefit
        except ValidationError as e:
            BenefitService._handle_validation_error(e)
        except IntegrityError as e:
            BenefitService._handle_integrity_error(e)

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
        # Get benefit using base method
        benefit = BenefitService._get_entity(benefit_id)

        # Validate data using utilities
        if "benefit_name" in update_data:
            benefit_name = update_data["benefit_name"].strip()
            validate_string_length(benefit_name, "benefit_name", min_length=2, max_length=255)
            update_data["benefit_name"] = benefit_name  # Persist trimmed value

        if "description" in update_data and update_data["description"]:
            validate_string_length(update_data["description"], "description", max_length=500, allow_none=True)

        if "in_or_out_patient" in update_data:
            valid_patient_types = ["INPATIENT", "OUTPATIENT", "BOTH"]
            validate_choice_value(update_data["in_or_out_patient"], valid_patient_types, "in_or_out_patient")

        if "limit_amount" in update_data:
            if isinstance(update_data["limit_amount"], str) and update_data["limit_amount"].strip() == "":
                update_data["limit_amount"] = None
            elif update_data["limit_amount"] is not None:
                from apps.core.utils.validation import validate_positive_amount
                validate_positive_amount(update_data["limit_amount"], "limit_amount", allow_none=True, allow_zero=True)

        # Resolve plan FK using base method
        if 'plan' in update_data:
            if update_data['plan']:
                from apps.schemes.models import Plan
                BenefitService._resolve_foreign_key(
                    update_data, "plan", Plan, "Plan", validate_active=True, allow_none=True
                )
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
            BenefitService._handle_validation_error(e)
        except IntegrityError as e:
            BenefitService._handle_integrity_error(e)

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
        return BenefitService.activate(entity_id=benefit_id, user=user)

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
        return BenefitService.deactivate(entity_id=benefit_id, user=user)

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
