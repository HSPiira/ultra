import csv
from io import StringIO

from django.core.exceptions import ValidationError
from django.db import transaction, IntegrityError
from django.db.models import Q

from apps.core.enums.choices import BusinessStatusChoices
from apps.core.exceptions.service_errors import (
    RequiredFieldError,
    NotFoundError,
    DuplicateError,
    InvalidValueError,
    InactiveEntityError,
)
from apps.schemes.models import Scheme
from apps.companies.models import Company


class SchemeService:
    """
    Scheme business logic for write operations.
    Handles all scheme-related write operations including CRUD, validation,
    and business logic. Read operations are handled by selectors.
    """

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
        # Validate required fields
        required_fields = [
            "scheme_name",
            "company",
            "card_code",
            "start_date",
            "end_date",
        ]
        for field in required_fields:
            if not scheme_data.get(field):
                raise RequiredFieldError(field)

        # Handle company field - convert ID to Company instance if needed
        company = scheme_data.get("company")
        if isinstance(company, str):
            try:
                company = Company.objects.get(id=company, is_deleted=False)
                scheme_data["company"] = company
            except Company.DoesNotExist:
                raise NotFoundError("Company", company)
        elif not isinstance(company, Company):
            raise InvalidValueError("company", "Company must be a valid Company instance or ID")

        # Validate company is active
        if company.status != BusinessStatusChoices.ACTIVE or company.is_deleted:
            raise InactiveEntityError("Company", "Company must be active to create a scheme")

        # Date validation
        if (
            scheme_data.get("start_date")
            and scheme_data.get("end_date")
            and scheme_data["start_date"] >= scheme_data["end_date"]
        ):
            raise InvalidValueError("end_date", "End date must be after start date")

        # Card code validation (length check - format handled by model)
        card_code = scheme_data.get("card_code", "").strip()
        if len(card_code) != 3:
            raise InvalidValueError("card_code", "Card code must be exactly 3 characters")

        # Create scheme - database unique constraints prevent duplicates atomically
        # This eliminates the race condition from check-then-create pattern
        try:
            scheme = Scheme.objects.create(**scheme_data)
            return scheme
        except ValidationError as e:
            # Check if this is a uniqueness validation error, otherwise re-raise
            error_msg = str(e).lower()
            if hasattr(e, 'message_dict'):
                for field, messages in e.message_dict.items():
                    if any('already exists' in str(msg).lower() for msg in messages):
                        raise DuplicateError("Scheme", [field], f"Scheme with this {field} already exists")
            # Not a uniqueness error - re-raise original ValidationError
            raise
        except IntegrityError as e:
            # Database constraint violation - determine which field caused it
            error_msg = str(e).lower()
            if 'card_code' in error_msg:
                raise DuplicateError("Scheme", ["card_code"], "Scheme with this card code already exists")
            elif 'scheme_name' in error_msg or 'unique' in error_msg:
                raise DuplicateError("Scheme", ["scheme_name"], "Scheme with this name already exists")
            else:
                # Unknown integrity error - re-raise as generic duplicate
                raise DuplicateError("Scheme", message="Scheme with duplicate unique field already exists")

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
        try:
            scheme = Scheme.objects.get(id=scheme_id, is_deleted=False)
        except Scheme.DoesNotExist:
            raise NotFoundError("Scheme", scheme_id)

        # Validate data
        if "scheme_name" in update_data and not update_data["scheme_name"]:
            raise RequiredFieldError("scheme_name")
        if "company" in update_data and not update_data["company"]:
            raise RequiredFieldError("company")
        if "card_code" in update_data and not update_data["card_code"]:
            raise RequiredFieldError("card_code")

        # Handle company field - convert ID to Company instance if needed
        if "company" in update_data:
            company = update_data["company"]
            if isinstance(company, str):
                try:
                    company = Company.objects.get(id=company, is_deleted=False)
                    update_data["company"] = company
                except Company.DoesNotExist:
                    raise NotFoundError("Company", company)
            elif not isinstance(company, Company):
                raise InvalidValueError("company", "Company must be a valid Company instance or ID")

            # Validate company is active
            if company.status != BusinessStatusChoices.ACTIVE or company.is_deleted:
                raise InactiveEntityError("Company", "Company must be active to update a scheme")

        # Date validation
        start_date = update_data.get("start_date", scheme.start_date)
        end_date = update_data.get("end_date", scheme.end_date)
        if start_date and end_date and start_date >= end_date:
            raise InvalidValueError("end_date", "End date must be after start date")

        # Card code validation
        if "card_code" in update_data:
            card_code = update_data["card_code"].strip()
            if len(card_code) != 3:
                raise InvalidValueError("card_code", "Card code must be exactly 3 characters")

        # Update fields
        for field, value in update_data.items():
            setattr(scheme, field, value)

        # Save - database constraints will prevent duplicates atomically
        try:
            scheme.save()
            return scheme
        except ValidationError as e:
            # Check if this is a uniqueness validation error, otherwise re-raise
            error_msg = str(e).lower()
            if hasattr(e, 'message_dict'):
                for field, messages in e.message_dict.items():
                    if any('already exists' in str(msg).lower() for msg in messages):
                        raise DuplicateError("Scheme", [field], f"Another scheme with this {field} already exists")
            # Not a uniqueness error - re-raise original ValidationError
            raise
        except IntegrityError as e:
            # Database constraint violation - determine which field caused it
            error_msg = str(e).lower()
            if 'card_code' in error_msg:
                raise DuplicateError("Scheme", ["card_code"], "Another scheme with this card code already exists")
            elif 'scheme_name' in error_msg or 'unique' in error_msg:
                raise DuplicateError("Scheme", ["scheme_name"], "Another scheme with this name already exists")
            else:
                raise DuplicateError("Scheme", message="Scheme with duplicate unique field already exists")

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
        try:
            scheme = Scheme.objects.get(id=scheme_id, is_deleted=False)
        except Scheme.DoesNotExist:
            raise NotFoundError("Scheme", scheme_id)

        scheme.status = BusinessStatusChoices.ACTIVE
        scheme.is_deleted = False
        scheme.deleted_at = None
        scheme.deleted_by = None
        scheme.save(update_fields=["status", "is_deleted", "deleted_at", "deleted_by"])
        return scheme

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
        try:
            scheme = Scheme.objects.get(id=scheme_id, is_deleted=False)
        except Scheme.DoesNotExist:
            raise NotFoundError("Scheme", scheme_id)

        scheme.status = BusinessStatusChoices.SUSPENDED
        suspension_note = f"\nSuspended: {reason}"
        scheme.remark = (
            f"{scheme.remark}{suspension_note}"
            if scheme.remark
            else f"Suspended: {reason}"
        )
        scheme.save(update_fields=["status", "remark"])
        return scheme

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
        if new_status not in [choice[0] for choice in BusinessStatusChoices.choices]:
            raise InvalidValueError("status", "Invalid status value")

        updated_count = Scheme.objects.filter(
            id__in=scheme_ids, is_deleted=False
        ).update(status=new_status)

        return updated_count

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

        output = StringIO()
        writer = csv.writer(output)

        # Write header
        writer.writerow(
            [
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
        )

        # Write data
        for scheme in schemes:
            writer.writerow(
                [
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
            )

        return output.getvalue()
