import csv
from io import StringIO

from django.core.exceptions import ValidationError
from django.db import transaction, IntegrityError

from apps.companies.models import Company, Industry
from apps.core.enums.choices import BusinessStatusChoices
from apps.core.exceptions.service_errors import (
    RequiredFieldError,
    NotFoundError,
    DuplicateError,
    InvalidValueError,
    DependencyError,
    InactiveEntityError,
)


class IndustryService:
    """
    Industry business logic for write operations.
    Handles all industry-related write operations including CRUD, validation,
    and business logic. Read operations are handled by selectors.
    """

    # ---------------------------------------------------------------------
    # Basic CRUD Operations
    # ---------------------------------------------------------------------

    @staticmethod
    @transaction.atomic
    def industry_create(*, industry_data: dict, user=None):
        """
        Create a new industry with validation and duplicate checking.

        Args:
            industry_data: Dictionary containing industry information
            user: User creating the industry (for audit trail)

        Returns:
            Industry: The created industry instance

        Raises:
            ValidationError: If data is invalid or duplicates exist
        """
        # Validate required fields
        required_fields = ["industry_name"]
        for field in required_fields:
            if not industry_data.get(field):
                raise RequiredFieldError(field)

        # Industry name validation
        industry_name = industry_data.get("industry_name", "").strip()
        if len(industry_name) < 2:
            raise InvalidValueError("industry_name", "Industry name must be at least 2 characters long")

        if len(industry_name) > 100:
            raise InvalidValueError("industry_name", "Industry name cannot exceed 100 characters")

        # Description validation
        if industry_data.get("description") and len(industry_data["description"]) > 500:
            raise InvalidValueError("description", "Description cannot exceed 500 characters")

        # Create industry - database unique constraints prevent duplicates atomically
        try:
            industry = Industry.objects.create(**industry_data)
            return industry
        except ValidationError as e:
            # Check if this is a uniqueness validation error, otherwise re-raise
            if hasattr(e, 'message_dict'):
                for field, messages in e.message_dict.items():
                    if any('already exists' in str(msg).lower() for msg in messages):
                        raise DuplicateError("Industry", [field], f"Industry with this {field} already exists")
            # Not a uniqueness error - re-raise original ValidationError
            raise
        except IntegrityError as e:
            # Database constraint violation
            error_msg = str(e).lower()
            if 'industry_name' in error_msg or 'unique' in error_msg:
                raise DuplicateError("Industry", ["industry_name"], "Industry with this name already exists")
            else:
                raise DuplicateError("Industry", message="Industry with duplicate unique field already exists")

    @staticmethod
    @transaction.atomic
    def industry_update(*, industry_id: str, update_data: dict, user=None):
        """
        Update industry with validation and duplicate checking.

        Args:
            industry_id: ID of the industry to update
            update_data: Dictionary containing fields to update
            user: User performing the update (for audit trail)

        Returns:
            Industry: The updated industry instance

        Raises:
            ValidationError: If data is invalid or duplicates exist
        """
        try:
            industry = Industry.objects.get(id=industry_id, is_deleted=False)
        except Industry.DoesNotExist:
            raise NotFoundError("Industry", industry_id)

        # Validate data
        if "industry_name" in update_data:
            industry_name = update_data["industry_name"].strip()
            if len(industry_name) < 2:
                raise InvalidValueError("industry_name", "Industry name must be at least 2 characters long")
            if len(industry_name) > 100:
                raise InvalidValueError("industry_name", "Industry name cannot exceed 100 characters")

        if (
            "description" in update_data
            and update_data["description"]
            and len(update_data["description"]) > 500
        ):
            raise InvalidValueError("description", "Description cannot exceed 500 characters")

        # Update fields
        for field, value in update_data.items():
            setattr(industry, field, value)

        # Save - database constraints will prevent duplicates atomically
        try:
            industry.save()
            return industry
        except ValidationError as e:
            # Check if this is a uniqueness validation error, otherwise re-raise
            if hasattr(e, 'message_dict'):
                for field, messages in e.message_dict.items():
                    if any('already exists' in str(msg).lower() for msg in messages):
                        raise DuplicateError("Industry", [field], f"Another industry with this {field} already exists")
            # Not a uniqueness error - re-raise original ValidationError
            raise
        except IntegrityError as e:
            # Database constraint violation
            error_msg = str(e).lower()
            if 'industry_name' in error_msg or 'unique' in error_msg:
                raise DuplicateError("Industry", ["industry_name"], "Another industry with this name already exists")
            else:
                raise DuplicateError("Industry", message="Industry with duplicate unique field already exists")

    # ---------------------------------------------------------------------
    # Status Management
    # ---------------------------------------------------------------------

    @staticmethod
    @transaction.atomic
    def industry_activate(*, industry_id: str, user=None):
        """
        Reactivate a previously deactivated industry.

        Args:
            industry_id: ID of the industry to activate
            user: User performing the activation

        Returns:
            Industry: The activated industry instance
        """
        try:
            industry = Industry.objects.get(id=industry_id, is_deleted=False)
        except Industry.DoesNotExist:
            raise NotFoundError("Industry", industry_id)

        industry.status = BusinessStatusChoices.ACTIVE
        industry.is_deleted = False
        industry.deleted_at = None
        industry.deleted_by = None
        industry.save(
            update_fields=["status", "is_deleted", "deleted_at", "deleted_by"]
        )
        return industry

    @staticmethod
    @transaction.atomic
    def industry_deactivate(*, industry_id: str, user=None):
        """
        Soft delete / deactivate industry.
        Checks if industry has associated companies before deactivation.

        Args:
            industry_id: ID of the industry to deactivate
            user: User performing the deactivation

        Returns:
            Industry: The deactivated industry instance

        Raises:
            ValidationError: If industry has associated companies
        """
        try:
            industry = Industry.objects.get(id=industry_id, is_deleted=False)
        except Industry.DoesNotExist:
            raise NotFoundError("Industry", industry_id)

        # Check if industry has associated companies
        company_count = Company.objects.filter(
            industry=industry, is_deleted=False
        ).count()
        if company_count > 0:
            raise DependencyError("Industry", ["companies"])

        industry.status = BusinessStatusChoices.INACTIVE
        industry.is_deleted = True
        industry.save(update_fields=["status", "is_deleted"])
        return industry

    @staticmethod
    @transaction.atomic
    def industry_suspend(*, industry_id: str, reason: str, user=None):
        """
        Suspend an industry with reason tracking.

        Args:
            industry_id: ID of the industry to suspend
            reason: Reason for suspension
            user: User performing the suspension

        Returns:
            Industry: The suspended industry instance
        """
        try:
            industry = Industry.objects.get(id=industry_id, is_deleted=False)
        except Industry.DoesNotExist:
            raise NotFoundError("Industry", industry_id)

        industry.status = BusinessStatusChoices.SUSPENDED
        suspension_note = f"\nSuspended: {reason}"
        industry.description = (
            f"{industry.description}{suspension_note}"
            if industry.description
            else f"Suspended: {reason}"
        )
        industry.save(update_fields=["status", "description"])
        return industry

    # ---------------------------------------------------------------------
    # Bulk Operations
    # ---------------------------------------------------------------------

    @staticmethod
    @transaction.atomic
    def industries_bulk_status_update(
        *, industry_ids: list, new_status: str, user=None
    ):
        """
        Bulk update industry status.

        Args:
            industry_ids: List of industry IDs to update
            new_status: New status to set
            user: User performing the update

        Returns:
            int: Number of industries updated
        """
        if new_status not in [choice[0] for choice in BusinessStatusChoices.choices]:
            raise InvalidValueError("status", "Invalid status value")

        # Check if any industries have companies (for deactivation)
        if new_status == BusinessStatusChoices.INACTIVE:
            industries_with_companies = Industry.objects.filter(
                id__in=industry_ids, is_deleted=False, companies__isnull=False
            ).distinct()

            if industries_with_companies.exists():
                raise DependencyError("Industry", ["companies"])

        updated_count = Industry.objects.filter(
            id__in=industry_ids, is_deleted=False
        ).update(status=new_status)

        return updated_count

    @staticmethod
    @transaction.atomic
    def companies_transfer_to_industry(
        *, company_ids: list, target_industry_id: str, user=None
    ):
        """
        Transfer companies from one industry to another.

        Args:
            company_ids: List of company IDs to transfer
            target_industry_id: ID of the target industry
            user: User performing the transfer

        Returns:
            int: Number of companies transferred
        """
        try:
            target_industry = Industry.objects.get(
                id=target_industry_id, is_deleted=False
            )
        except Industry.DoesNotExist:
            raise NotFoundError("Industry", target_industry_id)

        if target_industry.status != BusinessStatusChoices.ACTIVE:
            raise InactiveEntityError("Industry", "Cannot transfer companies to inactive industry")

        updated_count = Company.objects.filter(
            id__in=company_ids, is_deleted=False
        ).update(industry=target_industry)

        return updated_count

    @staticmethod
    @transaction.atomic
    def industries_merge(
        *, source_industry_id: str, target_industry_id: str, user=None
    ):
        """
        Merge two industries, transferring all companies from source to target.

        Args:
            source_industry_id: ID of the industry to merge from
            target_industry_id: ID of the industry to merge into
            user: User performing the merge

        Returns:
            dict: Merge results
        """
        try:
            source_industry = Industry.objects.get(
                id=source_industry_id, is_deleted=False
            )
        except Industry.DoesNotExist:
            raise NotFoundError("Industry", source_industry_id)

        try:
            target_industry = Industry.objects.get(
                id=target_industry_id, is_deleted=False
            )
        except Industry.DoesNotExist:
            raise NotFoundError("Industry", target_industry_id)

        if source_industry.id == target_industry.id:
            raise InvalidValueError("target_industry_id", "Cannot merge industry with itself")

        # Get companies to transfer
        companies_to_transfer = Company.objects.filter(
            industry=source_industry, is_deleted=False
        )

        company_count = companies_to_transfer.count()

        # Transfer companies
        companies_to_transfer.update(industry=target_industry)

        # Deactivate source industry manually (don't call deactivate_industry)
        source_industry.status = BusinessStatusChoices.INACTIVE
        source_industry.is_deleted = True
        source_industry.save()

        return {
            "source_industry": source_industry.industry_name,
            "target_industry": target_industry.industry_name,
            "companies_transferred": company_count,
            "source_deactivated": True,
        }

    @staticmethod
    def industries_export_csv(*, filters: dict = None):
        """
        Export filtered industries to CSV format.

        Args:
            filters: Optional filters to apply

        Returns:
            str: CSV content as string
        """
        from apps.companies.selectors import industry_list

        if filters:
            industries = industry_list(filters=filters)
        else:
            industries = Industry.objects.filter(is_deleted=False)

        output = StringIO()
        writer = csv.writer(output)

        # Write header
        writer.writerow(
            [
                "ID",
                "Industry Name",
                "Description",
                "Status",
                "Company Count",
                "Created At",
                "Updated At",
            ]
        )

        # Write data
        for industry in industries:
            company_count = Company.objects.filter(
                industry_id=industry.id, is_deleted=False
            ).count()
            writer.writerow(
                [
                    industry.id,
                    industry.industry_name,
                    industry.description or "",
                    industry.status,
                    company_count,
                    industry.created_at.strftime("%Y-%m-%d %H:%M:%S"),
                    industry.updated_at.strftime("%Y-%m-%d %H:%M:%S"),
                ]
            )

        return output.getvalue()
