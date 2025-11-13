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
from apps.core.services import (
    BaseService,
    CSVExportMixin,
    RequiredFieldsRule,
    StringLengthRule,
)
from apps.core.exports import ExportableMixin
from apps.core.utils.validation import validate_required_fields, validate_string_length


class IndustryService(BaseService, CSVExportMixin, ExportableMixin):
    """
    Industry business logic for write operations.
    Handles all industry-related write operations including CRUD, validation,
    and business logic. Read operations are handled by selectors.
    
    Uses SOLID improvements:
    - Validation rules for extensible validation (OCP)
    - Standardized method signatures available (ISP)
    """
    
    # BaseService configuration
    entity_model = Industry
    entity_name = "Industry"
    unique_fields = ["industry_name"]
    allowed_fields = {'industry_name', 'description', 'status'}
    validation_rules = [
        RequiredFieldsRule(["industry_name"], "Industry"),
        StringLengthRule("industry_name", min_length=2, max_length=100),
        StringLengthRule("description", max_length=500, min_length=None),
    ]

    # ------------------------------------------------------------------
    # Export Configuration (ExportableMixin interface)
    # ------------------------------------------------------------------

    @staticmethod
    def _get_export_queryset(filters: dict | None = None):
        """Get queryset for export with optional filters."""
        from apps.companies.selectors import industry_list

        if filters:
            return industry_list(filters=filters)
        return Industry.objects.filter(is_deleted=False)

    @staticmethod
    def _get_export_headers() -> list[str]:
        """Return column headers for industry export."""
        return [
            "ID",
            "Industry Name",
            "Description",
            "Status",
            "Company Count",
            "Created At",
            "Updated At",
        ]

    @staticmethod
    def _get_export_row(industry) -> list[str]:
        """Extract data from industry instance for export row."""
        company_count = Company.objects.filter(
            industry_id=industry.id, is_deleted=False
        ).count()
        return [
            str(industry.id),
            industry.industry_name,
            industry.description or "",
            industry.status,
            str(company_count),
            industry.created_at.strftime("%Y-%m-%d %H:%M:%S"),
            industry.updated_at.strftime("%Y-%m-%d %H:%M:%S"),
        ]

    # ---------------------------------------------------------------------
    # Basic CRUD Operations
    # ---------------------------------------------------------------------

    @classmethod
    @transaction.atomic
    def industry_create(cls, *, industry_data: dict, user=None):
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
        # Filter fields if allowed_fields is defined
        if cls.allowed_fields is not None:
            industry_data = cls._filter_model_fields(industry_data, cls.allowed_fields)
        
        # Apply validation rules (configured in BaseService)
        cls._apply_validation_rules(industry_data)
        
        # Trim industry name
        if "industry_name" in industry_data:
            industry_data["industry_name"] = industry_data.get("industry_name", "").strip()

        # Create industry - database unique constraints prevent duplicates atomically
        try:
            industry = Industry.objects.create(**industry_data)
            return industry
        except ValidationError as e:
            cls._handle_validation_error(e)
        except IntegrityError as e:
            cls._handle_integrity_error(e)

    @classmethod
    @transaction.atomic
    def industry_update(cls, *, industry_id: str, update_data: dict, user=None):
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
        # Get industry using base method
        industry = cls._get_entity(industry_id)

        # Filter fields if allowed_fields is defined
        if cls.allowed_fields is not None:
            update_data = cls._filter_model_fields(update_data, cls.allowed_fields)
        
        # Merge with existing data for validation (required fields must be present)
        merged_data = {}
        for field in cls.allowed_fields:
            if hasattr(industry, field):
                merged_data[field] = getattr(industry, field)
        merged_data.update(update_data)
        
        # Apply validation rules (configured in BaseService)
        cls._apply_validation_rules(merged_data, entity=industry)
        
        # Trim industry name if being updated
        if "industry_name" in update_data:
            merged_data["industry_name"] = merged_data.get("industry_name", "").strip()
            update_data["industry_name"] = merged_data["industry_name"]

        # Update fields
        for field, value in update_data.items():
            setattr(industry, field, value)

        # Save - database constraints will prevent duplicates atomically
        try:
            industry.save()
            return industry
        except ValidationError as e:
            cls._handle_validation_error(e)
        except IntegrityError as e:
            cls._handle_integrity_error(e)

    # ---------------------------------------------------------------------
    # Status Management
    # ---------------------------------------------------------------------

    @classmethod
    @transaction.atomic
    def industry_activate(cls, *, industry_id: str, user=None):
        """
        Reactivate a previously deactivated industry.

        Args:
            industry_id: ID of the industry to activate
            user: User performing the activation

        Returns:
            Industry: The activated industry instance
        """
        return cls.activate(entity_id=industry_id, user=user)

    @classmethod
    @transaction.atomic
    def industry_deactivate(cls, *, industry_id: str, user=None):
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
        industry = cls._get_entity(industry_id)

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

    @classmethod
    @transaction.atomic
    def industry_suspend(cls, *, industry_id: str, reason: str, user=None):
        """
        Suspend an industry with reason tracking.

        Args:
            industry_id: ID of the industry to suspend
            reason: Reason for suspension
            user: User performing the suspension

        Returns:
            Industry: The suspended industry instance
        """
        return cls.suspend(entity_id=industry_id, reason=reason, user=user)

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
        # Check if any industries have companies (for deactivation)
        if new_status == BusinessStatusChoices.INACTIVE:
            industries_with_companies = Industry.objects.filter(
                id__in=industry_ids, is_deleted=False, companies__isnull=False
            ).distinct()

            if industries_with_companies.exists():
                raise DependencyError("Industry", ["companies"])

        return IndustryService.bulk_status_update(
            entity_ids=industry_ids,
            new_status=new_status,
            user=user
        )

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

    # ---------------------------------------------------------------------
    # Export Operations
    # ---------------------------------------------------------------------

    @staticmethod
    def industries_export_csv(*, filters: dict = None) -> str:
        """
        Export filtered industries to CSV format using SOLID export framework.

        Args:
            filters: Optional filters to apply

        Returns:
            str: CSV content as string
        """
        content, _, _ = IndustryService.export_to_format('csv', filters=filters)
        return content.decode('utf-8')

    @staticmethod
    def industries_export_xlsx(*, filters: dict = None) -> bytes:
        """
        Export filtered industries to XLSX format using SOLID export framework.

        Args:
            filters: Optional filters to apply

        Returns:
            bytes: XLSX file content
        """
        content, _, _ = IndustryService.export_to_format(
            'xlsx',
            filters=filters,
            sheet_name='Industries'
        )
        return content

    @staticmethod
    def industries_export_pdf(*, filters: dict = None) -> bytes:
        """
        Export filtered industries to PDF format using SOLID export framework.

        Args:
            filters: Optional filters to apply

        Returns:
            bytes: PDF file content
        """
        content, _, _ = IndustryService.export_to_format(
            'pdf',
            filters=filters,
            title='Industries Export',
            orientation='landscape'
        )
        return content
