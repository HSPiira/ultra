from django.core.exceptions import ValidationError
from django.db import transaction, IntegrityError

from apps.core.enums.choices import BusinessStatusChoices
from apps.core.exceptions.service_errors import (
    RequiredFieldError,
    NotFoundError,
    DuplicateError,
    InvalidValueError,
)
from apps.core.services import (
    BaseService,
    CSVExportMixin,
    RequiredFieldsRule,
    StringLengthRule,
)
from apps.core.utils.validation import (
    validate_required_fields,
    validate_string_length,
    validate_choice_value,
    validate_positive_amount,
)
from apps.schemes.models import Benefit


class BenefitService(BaseService, CSVExportMixin):
    """
    Benefit business logic for write operations.
    Handles all benefit-related write operations including CRUD, validation,
    and business logic. Read operations are handled by selectors.
    
    Uses SOLID improvements:
    - Validation rules for extensible validation (OCP)
    - Standardized method signatures available (ISP)
    """
    
    # BaseService configuration
    entity_model = Benefit
    entity_name = "Benefit"
    unique_fields = ["benefit_name"]
    allowed_fields = {
        'benefit_name', 'description', 'in_or_out_patient', 'limit_amount',
        'plan', 'status'
    }
    validation_rules = [
        RequiredFieldsRule(["benefit_name", "in_or_out_patient"], "Benefit"),
        StringLengthRule("benefit_name", min_length=2, max_length=255),
        StringLengthRule("description", max_length=500, min_length=None),
    ]

    # ---------------------------------------------------------------------
    # Basic CRUD Operations
    # ---------------------------------------------------------------------

    @classmethod
    @transaction.atomic
    def benefit_create(cls, *, benefit_data: dict, user=None):
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
        # Filter fields if allowed_fields is defined
        if cls.allowed_fields is not None:
            benefit_data = cls._filter_model_fields(benefit_data, cls.allowed_fields)
        
        # Apply validation rules (configured in BaseService)
        cls._apply_validation_rules(benefit_data)
        
        # Trim benefit name
        if "benefit_name" in benefit_data:
            benefit_data["benefit_name"] = benefit_data.get("benefit_name", "").strip()

        # Patient type validation using utility (business-specific validation)
        valid_patient_types = ["INPATIENT", "OUTPATIENT", "BOTH"]
        validate_choice_value(benefit_data.get("in_or_out_patient"), valid_patient_types, "in_or_out_patient")

        # Limit amount validation (business-specific validation)
        limit_amount = benefit_data.get("limit_amount")
        if limit_amount == "":
            benefit_data["limit_amount"] = None
        elif limit_amount is not None:
            validate_positive_amount(limit_amount, "limit_amount", allow_none=True, allow_zero=True)

        # Resolve plan FK using base method
        if 'plan' in benefit_data and benefit_data['plan']:
            from apps.schemes.models import Plan
            cls._resolve_foreign_key(
                benefit_data, "plan", Plan, "Plan", validate_active=True
            )
        elif 'plan' in benefit_data and benefit_data['plan'] is None:
            benefit_data['plan'] = None

        # Create benefit - database unique constraints prevent duplicates atomically
        try:
            benefit = Benefit.objects.create(**benefit_data)
            return benefit
        except ValidationError as e:
            cls._handle_validation_error(e)
        except IntegrityError as e:
            cls._handle_integrity_error(e)

    @classmethod
    @transaction.atomic
    def benefit_update(cls, *, benefit_id: str, update_data: dict, user=None):
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
        benefit = cls._get_entity(benefit_id)
        
        # Filter fields if allowed_fields is defined
        if cls.allowed_fields is not None:
            update_data = cls._filter_model_fields(update_data, cls.allowed_fields)
        
        # Merge with existing data for validation (required fields must be present)
        merged_data = {}
        for field in cls.allowed_fields:
            if hasattr(benefit, field):
                merged_data[field] = getattr(benefit, field)
        merged_data.update(update_data)
        
        # Apply validation rules (configured in BaseService)
        cls._apply_validation_rules(merged_data, entity=benefit)
        
        # Trim benefit name if being updated
        if "benefit_name" in update_data:
            merged_data["benefit_name"] = merged_data.get("benefit_name", "").strip()
            update_data["benefit_name"] = merged_data["benefit_name"]

        # Patient type validation if being updated
        if "in_or_out_patient" in update_data:
            valid_patient_types = ["INPATIENT", "OUTPATIENT", "BOTH"]
            validate_choice_value(update_data["in_or_out_patient"], valid_patient_types, "in_or_out_patient")

        # Limit amount validation if being updated
        if "limit_amount" in update_data:
            limit_amount = update_data["limit_amount"]
            if isinstance(limit_amount, str) and limit_amount.strip() == "":
                update_data["limit_amount"] = None
            elif limit_amount is not None:
                validate_positive_amount(limit_amount, "limit_amount", allow_none=True, allow_zero=True)

        # Resolve plan FK using base method if being updated
        if 'plan' in update_data:
            if update_data['plan']:
                from apps.schemes.models import Plan
                cls._resolve_foreign_key(
                    update_data, "plan", Plan, "Plan", validate_active=True
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
            cls._handle_validation_error(e)
        except IntegrityError as e:
            cls._handle_integrity_error(e)

    # ---------------------------------------------------------------------
    # Status Management
    # ---------------------------------------------------------------------

    @classmethod
    @transaction.atomic
    def benefit_activate(cls, *, benefit_id: str, user=None):
        """
        Reactivate a previously deactivated benefit.

        Args:
            benefit_id: ID of the benefit to activate
            user: User performing the activation

        Returns:
            Benefit: The activated benefit instance
        """
        return cls.activate(entity_id=benefit_id, user=user)

    @classmethod
    @transaction.atomic
    def benefit_deactivate(cls, *, benefit_id: str, user=None):
        """
        Soft delete / deactivate benefit.

        Args:
            benefit_id: ID of the benefit to deactivate
            user: User performing the deactivation

        Returns:
            Benefit: The deactivated benefit instance
        """
        return cls.deactivate(entity_id=benefit_id, user=user, soft_delete=True)

    @classmethod
    @transaction.atomic
    def benefit_suspend(cls, *, benefit_id: str, reason: str, user=None):
        """
        Suspend a benefit with reason tracking.

        Args:
            benefit_id: ID of the benefit to suspend
            reason: Reason for suspension
            user: User performing the suspension

        Returns:
            Benefit: The suspended benefit instance
        """
        return cls.suspend(entity_id=benefit_id, reason=reason, user=user)

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
        return BenefitService.bulk_status_update(entity_ids=benefit_ids, new_status=new_status, user=user)

    # CSV Export configuration
    csv_headers = [
        "ID",
        "Benefit Name",
        "Description",
        "Patient Type",
        "Limit Amount",
        "Status",
        "Created At",
        "Updated At",
    ]
    
    @staticmethod
    def get_csv_row_data(benefit):
        """Get CSV row data for a benefit."""
        return [
            benefit.id,
            benefit.benefit_name,
            benefit.description or "",
            benefit.in_or_out_patient,
            benefit.limit_amount or "",
            benefit.status,
            benefit.created_at.strftime("%Y-%m-%d %H:%M:%S"),
            benefit.updated_at.strftime("%Y-%m-%d %H:%M:%S"),
        ]
    
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
            benefits = list(benefit_list(filters=filters))
        else:
            benefits = list(Benefit.objects.filter(is_deleted=False))

        return BenefitService.export_to_csv(
            queryset=benefits,
            headers=BenefitService.csv_headers,
            row_extractor=BenefitService.get_csv_row_data
        )
