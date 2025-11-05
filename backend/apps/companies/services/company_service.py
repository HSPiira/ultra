from django.core.exceptions import ValidationError
from django.db import transaction, IntegrityError

from apps.companies.models import Company
from apps.core.enums.choices import BusinessStatusChoices
from apps.core.exceptions.service_errors import (
    RequiredFieldError,
    NotFoundError,
    DuplicateError,
    InvalidFormatError,
    InvalidValueError,
)
from apps.core.services import BaseService, CSVExportMixin
from apps.core.utils.validation import validate_required_fields, validate_email_format


class CompanyService(BaseService, CSVExportMixin):
    """
    Company business logic for write operations.
    Handles all company-related write operations including CRUD, validation,
    and business logic. Read operations are handled by selectors.
    """
    
    # BaseService configuration
    entity_model = Company
    entity_name = "Company"
    unique_fields = ["company_name", "email"]
    """
    Company business logic for write operations.
    Handles all company-related write operations including CRUD, validation,
    and business logic. Read operations are handled by selectors.
    """

    # ---------------------------------------------------------------------
    # Basic CRUD Operations
    # ---------------------------------------------------------------------

    @staticmethod
    @transaction.atomic
    def company_create(*, company_data: dict, user=None):
        """
        Create a new company with validation.

        Uses database constraints to prevent duplicates, eliminating race conditions.
        The @transaction.atomic decorator ensures rollback on any error.

        Args:
            company_data: Dictionary containing company information
            user: User creating the company (for audit trail)

        Returns:
            Company: The created company instance

        Raises:
            RequiredFieldError: If required field is missing
            NotFoundError: If referenced industry doesn't exist
            InvalidFormatError: If email or phone format is invalid
            DuplicateError: If company name or email already exists
        """
        # Validate required fields using base method
        required_fields = [
            "company_name",
            "contact_person",
            "email",
            "phone_number",
            "industry",
        ]
        CompanyService._validate_required_fields(company_data, required_fields)

        # Email format validation using utility
        validate_email_format(company_data.get("email"), "email")

        # Phone number validation is handled by model validators
        # Service layer does basic presence check only

        # Create a mutable copy of the data
        data = dict(company_data)

        # Resolve industry FK using base method
        if "industry" in data:
            from apps.companies.models import Industry
            CompanyService._resolve_foreign_key(
                data, "industry", Industry, "Industry", validate_active=True
            )

        # Create company - database unique constraints prevent duplicates atomically
        try:
            company = Company.objects.create(**data)
            return company
        except ValidationError as e:
            CompanyService._handle_validation_error(e)
        except IntegrityError as e:
            CompanyService._handle_integrity_error(e)

    @staticmethod
    @transaction.atomic
    def company_update(*, company_id: str, update_data: dict, user=None):
        """
        Update company with validation.

        Uses database constraints to prevent duplicates, eliminating race conditions.

        Args:
            company_id: ID of the company to update
            update_data: Dictionary containing fields to update
            user: User performing the update (for audit trail)

        Returns:
            Company: The updated company instance

        Raises:
            NotFoundError: If company doesn't exist
            RequiredFieldError: If required field set to empty
            InvalidFormatError: If email format is invalid
            DuplicateError: If company name or email conflicts
        """
        # Get company using base method
        company = CompanyService._get_entity(company_id)

        # Validate required fields if present in update
        for field in ["company_name", "contact_person", "email", "phone_number", "industry"]:
            if field in update_data and not update_data[field]:
                raise RequiredFieldError(field)

        # Email format validation using utility
        if "email" in update_data and update_data["email"]:
            validate_email_format(update_data["email"], "email")

        # Phone number validation is handled by model validators

        # Create a mutable copy of the data
        data = dict(update_data)

        # Resolve industry FK using base method
        if "industry" in data:
            from apps.companies.models import Industry
            CompanyService._resolve_foreign_key(
                data, "industry", Industry, "Industry", validate_active=True
            )

        # Update fields
        for field, value in data.items():
            setattr(company, field, value)

        # Save - database constraints will prevent duplicates atomically
        try:
            company.save()
            return company
        except ValidationError as e:
            CompanyService._handle_validation_error(e)
        except IntegrityError as e:
            CompanyService._handle_integrity_error(e)

    # ---------------------------------------------------------------------
    # Status Management
    # ---------------------------------------------------------------------

    @staticmethod
    @transaction.atomic
    def company_activate(*, company_id: str, user=None):
        """
        Reactivate a previously deactivated company.

        Args:
            company_id: ID of the company to activate
            user: User performing the activation

        Returns:
            Company: The activated company instance
        """
        return CompanyService.activate(entity_id=company_id, user=user)

    @staticmethod
    @transaction.atomic
    def company_deactivate(*, company_id: str, user=None):
        """
        Deactivate company (change status to INACTIVE without soft-deleting).

        Args:
            company_id: ID of the company to deactivate
            user: User performing the deactivation

        Returns:
            Company: The deactivated company instance
        """
        return CompanyService.deactivate(entity_id=company_id, user=user, soft_delete=False)

    @staticmethod
    @transaction.atomic
    def company_soft_delete(*, company_id: str, user=None):
        """
        Soft delete company (mark as deleted, remove from active lists).

        Args:
            company_id: ID of the company to soft delete
            user: User performing the soft deletion

        Returns:
            Company: The soft-deleted company instance
        """
        try:
            company = Company.objects.get(id=company_id, is_deleted=False)
        except Company.DoesNotExist:
            raise NotFoundError("Company", company_id)

        # Use the model's soft_delete method which handles all the soft delete fields
        # Only pass user if it's authenticated (not AnonymousUser)
        if user and user.is_authenticated:
            company.soft_delete(user=user)
        else:
            company.soft_delete(user=None)
        return company

    @staticmethod
    @transaction.atomic
    def company_suspend(*, company_id: str, reason: str, user=None):
        """
        Suspend a company with reason tracking.

        Args:
            company_id: ID of the company to suspend
            reason: Reason for suspension
            user: User performing the suspension

        Returns:
            Company: The suspended company instance
        """
        instance = CompanyService._get_entity(company_id)
        
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
    def companies_bulk_status_update(*, company_ids: list, new_status: str, user=None):
        """
        Bulk update company status.

        Args:
            company_ids: List of company IDs to update
            new_status: New status to set
            user: User performing the update

        Returns:
            int: Number of companies updated
        """
        return CompanyService.bulk_status_update(
            entity_ids=company_ids,
            new_status=new_status,
            user=user
        )

    @staticmethod
    def companies_export_csv(*, filters: dict = None):
        """
        Export filtered companies to CSV format.

        Args:
            filters: Optional filters to apply

        Returns:
            str: CSV content as string
        """
        from apps.companies.selectors import company_list

        if filters:
            companies = company_list(filters=filters)
        else:
            companies = Company.objects.filter(is_deleted=False)

        headers = [
            "ID",
            "Company Name",
            "Contact Person",
            "Email",
            "Phone Number",
            "Website",
            "Address",
            "Industry",
            "Status",
            "Created At",
            "Updated At",
        ]

        def row_extractor(company):
            return [
                company.id,
                company.company_name,
                company.contact_person,
                company.email,
                company.phone_number,
                company.website or "",
                company.company_address,
                company.industry.industry_name if company.industry else "",
                company.status,
                company.created_at.strftime("%Y-%m-%d %H:%M:%S"),
                company.updated_at.strftime("%Y-%m-%d %H:%M:%S"),
            ]

        return CompanyService.export_to_csv(companies, headers, row_extractor)
