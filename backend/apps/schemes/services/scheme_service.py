from django.core.exceptions import ValidationError
from django.db import transaction, IntegrityError

from apps.core.enums.choices import BusinessStatusChoices
from apps.core.exceptions.service_errors import (
    RequiredFieldError,
    NotFoundError,
    DuplicateError,
    InvalidValueError,
    InactiveEntityError,
)
from apps.core.services import (
    BaseService,
    CSVExportMixin,
    RequiredFieldsRule,
    StringLengthRule,
    DateRangeRule,
)
from apps.core.utils.validation import validate_required_fields, validate_string_length, validate_date_range
from apps.schemes.models import Scheme
from apps.companies.models import Company


class SchemeService(BaseService, CSVExportMixin):
    """
    Scheme business logic for write operations.
    Handles all scheme-related write operations including CRUD, validation,
    and business logic. Read operations are handled by selectors.
    
    Uses SOLID improvements:
    - Validation rules for extensible validation (OCP)
    - Standardized method signatures available (ISP)
    """
    
    # BaseService configuration
    entity_model = Scheme
    entity_name = "Scheme"
    unique_fields = ["scheme_name", "card_code"]
    allowed_fields = {
        'scheme_name', 'company', 'card_code', 'start_date', 'end_date',
        'limit_amount', 'status', 'description'
    }
    validation_rules = [
        RequiredFieldsRule(
            ["scheme_name", "company", "card_code", "start_date", "end_date"],
            "Scheme"
        ),
        StringLengthRule("card_code", min_length=3, max_length=3),
        DateRangeRule("start_date", "end_date"),
    ]

    # ---------------------------------------------------------------------
    # Basic CRUD Operations
    # ---------------------------------------------------------------------

    @staticmethod
    @transaction.atomic
    def scheme_create(*, scheme_data: dict, user=None):
        """
        Create a new scheme with validation.

        Uses database constraints to prevent duplicates, eliminating race conditions.
        The @transaction.atomic decorator ensures rollback on any error.

        Args:
            scheme_data: Dictionary containing scheme information
            user: User creating the scheme (for audit trail)

        Returns:
            Scheme: The created scheme instance

        Raises:
            RequiredFieldError: If required field is missing
            NotFoundError: If referenced company doesn't exist
            InvalidValueError: If field value is invalid
            InactiveEntityError: If company is not active
            DuplicateError: If scheme name or card code already exists
        """
        # Validate required fields using base method
        required_fields = [
            "scheme_name",
            "company",
            "card_code",
            "start_date",
            "end_date",
        ]
        SchemeService._validate_required_fields(scheme_data, required_fields)

        # Resolve company FK using base method
        SchemeService._resolve_foreign_key(
            scheme_data, "company", Company, "Company", validate_active=True
        )

        # Date validation using utility
        validate_date_range(
            scheme_data.get("start_date"),
            scheme_data.get("end_date"),
            "start_date",
            "end_date"
        )

        # Card code validation (length check - format handled by model)
        card_code = scheme_data.get("card_code", "").strip()
        validate_string_length(card_code, "card_code", min_length=3, max_length=3)
        scheme_data["card_code"] = card_code  # Persist trimmed value

        # Create scheme - database unique constraints prevent duplicates atomically
        try:
            scheme = Scheme.objects.create(**scheme_data)
            return scheme
        except ValidationError as e:
            SchemeService._handle_validation_error(e)
        except IntegrityError as e:
            SchemeService._handle_integrity_error(e)

    @staticmethod
    @transaction.atomic
    def scheme_update(*, scheme_id: str, update_data: dict, user=None):
        """
        Update scheme with validation.

        Uses database constraints to prevent duplicates, eliminating race conditions.

        Args:
            scheme_id: ID of the scheme to update
            update_data: Dictionary containing fields to update
            user: User performing the update (for audit trail)

        Returns:
            Scheme: The updated scheme instance

        Raises:
            NotFoundError: If scheme doesn't exist
            RequiredFieldError: If required field set to empty
            InvalidValueError: If field value is invalid
            InactiveEntityError: If company is not active
            DuplicateError: If scheme name or card code conflicts
        """
        # Get scheme using base method
        scheme = SchemeService._get_entity(scheme_id)

        # Validate required fields if present in update
        for field in ["scheme_name", "company", "card_code"]:
            if field in update_data and not update_data[field]:
                raise RequiredFieldError(field)

        # Resolve company FK using base method
        if "company" in update_data:
            SchemeService._resolve_foreign_key(
                update_data, "company", Company, "Company", validate_active=True
            )

        # Date validation using utility
        start_date = update_data.get("start_date", scheme.start_date)
        end_date = update_data.get("end_date", scheme.end_date)
        validate_date_range(start_date, end_date, "start_date", "end_date")

        # Card code validation
        if "card_code" in update_data:
            card_code = update_data["card_code"].strip()
            validate_string_length(card_code, "card_code", min_length=3, max_length=3)
            update_data["card_code"] = card_code  # Persist trimmed value

        # Update fields
        for field, value in update_data.items():
            setattr(scheme, field, value)

        # Save - database constraints will prevent duplicates atomically
        try:
            scheme.save()
            return scheme
        except ValidationError as e:
            SchemeService._handle_validation_error(e)
        except IntegrityError as e:
            SchemeService._handle_integrity_error(e)

    # ---------------------------------------------------------------------
    # Status Management
    # ---------------------------------------------------------------------

    @staticmethod
    @transaction.atomic
    def scheme_activate(*, scheme_id: str, user=None):
        """
        Reactivate a previously deactivated scheme.

        Args:
            scheme_id: ID of the scheme to activate
            user: User performing the activation

        Returns:
            Scheme: The activated scheme instance
        """
        return SchemeService.activate(entity_id=scheme_id, user=user)

    @staticmethod
    @transaction.atomic
    def scheme_deactivate(*, scheme_id: str, user=None):
        """
        Soft delete / deactivate scheme.

        Uses the model's soft_delete method which enforces referential checks
        to prevent deletion when related scheme items or members exist.

        Args:
            scheme_id: ID of the scheme to deactivate
            user: User performing the deactivation

        Returns:
            Scheme: The deactivated scheme instance

        Raises:
            NotFoundError: If scheme doesn't exist
            ValidationError: If scheme has related scheme items or members
        """
        try:
            # Lock the row to ensure atomic checks and update
            scheme = Scheme.objects.select_for_update().get(id=scheme_id, is_deleted=False)
        except Scheme.DoesNotExist as exc:
            raise NotFoundError("Scheme", scheme_id) from exc

        # Call model's soft_delete which enforces referential checks
        # This will raise ValidationError if scheme has related items or members
        scheme.soft_delete(user=user)

        # Set status to INACTIVE after successful soft delete
        scheme.status = BusinessStatusChoices.INACTIVE
        scheme.save(update_fields=["status"])
        return scheme

    @staticmethod
    @transaction.atomic
    def scheme_suspend(*, scheme_id: str, reason: str, user=None):
        """
        Suspend a scheme with reason tracking.

        Args:
            scheme_id: ID of the scheme to suspend
            reason: Reason for suspension
            user: User performing the suspension

        Returns:
            Scheme: The suspended scheme instance
        """
        instance = SchemeService._get_entity(scheme_id)
        
        instance.status = BusinessStatusChoices.SUSPENDED
        update_fields = ["status"]
        
        # Use remark field for suspension note
        if reason and hasattr(instance, 'remark'):
            suspension_note = f"\nSuspended: {reason}"
            instance.remark = (
                f"{instance.remark}{suspension_note}"
                if instance.remark
                else f"Suspended: {reason}"
            )
            update_fields.append("remark")
        
        instance.save(update_fields=update_fields)
        return instance

    # ---------------------------------------------------------------------
    # Bulk Operations
    # ---------------------------------------------------------------------

    @staticmethod
    @transaction.atomic
    def schemes_bulk_status_update(*, scheme_ids: list, new_status: str, user=None):
        """
        Bulk update scheme status.

        Args:
            scheme_ids: List of scheme IDs to update
            new_status: New status to set
            user: User performing the update

        Returns:
            int: Number of schemes updated
        """
        return SchemeService.bulk_status_update(
            entity_ids=scheme_ids,
            new_status=new_status,
            user=user
        )

    @staticmethod
    def schemes_export_csv(*, filters: dict = None):
        """
        Export filtered schemes to CSV format.

        Args:
            filters: Optional filters to apply

        Returns:
            str: CSV content as string
        """
        from apps.schemes.selectors import scheme_list

        if filters:
            schemes = scheme_list(filters=filters)
        else:
            schemes = Scheme.objects.filter(is_deleted=False)

        headers = [
            "ID",
            "Scheme Name",
            "Company",
            "Card Code",
            "Description",
            "Start Date",
            "End Date",
            "Termination Date",
            "Limit Amount",
            "Family Applicable",
            "Status",
            "Created At",
            "Updated At",
        ]

        def row_extractor(scheme):
            return [
                scheme.id,
                scheme.scheme_name,
                scheme.company.company_name if scheme.company else "",
                scheme.card_code,
                scheme.description or "",
                scheme.start_date.strftime("%Y-%m-%d"),
                scheme.end_date.strftime("%Y-%m-%d"),
                (
                    scheme.termination_date.strftime("%Y-%m-%d")
                    if scheme.termination_date
                    else ""
                ),
                scheme.limit_amount,
                scheme.family_applicable,
                scheme.status,
                scheme.created_at.strftime("%Y-%m-%d %H:%M:%S"),
                scheme.updated_at.strftime("%Y-%m-%d %H:%M:%S"),
            ]

        return SchemeService.export_to_csv(schemes, headers, row_extractor)
