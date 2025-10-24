import csv
from io import StringIO

from django.core.exceptions import ValidationError
from django.db import transaction
from django.db.models import Q

from apps.companies.models import Company
from apps.core.enums.choices import BusinessStatusChoices


class CompanyService:
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
        Create a new company with validation and duplicate checking.

        Args:
            company_data: Dictionary containing company information
            user: User creating the company (for audit trail)

        Returns:
            Company: The created company instance

        Raises:
            ValidationError: If data is invalid or duplicates exist
        """
        # Validate data
        required_fields = [
            "company_name",
            "contact_person",
            "email",
            "phone_number",
            "industry",
        ]
        for field in required_fields:
            if not company_data.get(field):
                raise ValidationError(f"{field} is required")

        # Email format validation
        if company_data.get("email") and "@" not in company_data["email"]:
            raise ValidationError("Invalid email format")

        # Phone number basic validation
        if company_data.get("phone_number"):
            phone = (
                company_data["phone_number"]
                .replace("+", "")
                .replace("-", "")
                .replace(" ", "")
            )
            if not phone.isdigit() or len(phone) < 10:
                raise ValidationError("Invalid phone number format")

        # Check for duplicates
        qs = Company.objects.filter(is_deleted=False)
        if qs.filter(
            Q(company_name__iexact=company_data.get("company_name"))
            | Q(email__iexact=company_data.get("email"))
        ).exists():
            raise ValidationError("Company with this name or email already exists")

        # Create a mutable copy of the data
        data = dict(company_data)
        
        # Handle industry ID - convert to Industry instance if needed
        if "industry" in data and isinstance(data["industry"], str):
            from apps.companies.models import Industry
            try:
                industry = Industry.objects.get(id=data["industry"], is_deleted=False)
                data["industry"] = industry
            except Industry.DoesNotExist:
                raise ValidationError("Invalid industry ID")

        # Create company
        company = Company.objects.create(**data)
        return company

    @staticmethod
    @transaction.atomic
    def company_update(*, company_id: str, update_data: dict, user=None):
        """
        Update company with validation and duplicate checking.

        Args:
            company_id: ID of the company to update
            update_data: Dictionary containing fields to update
            user: User performing the update (for audit trail)

        Returns:
            Company: The updated company instance

        Raises:
            ValidationError: If data is invalid or duplicates exist
        """
        try:
            company = Company.objects.get(id=company_id, is_deleted=False)
        except Company.DoesNotExist as e:
            raise ValidationError("Company not found") from e

        # Validate data
        if "company_name" in update_data and not update_data["company_name"]:
            raise ValidationError("company_name is required")
        if "contact_person" in update_data and not update_data["contact_person"]:
            raise ValidationError("contact_person is required")
        if "email" in update_data and not update_data["email"]:
            raise ValidationError("email is required")
        if "phone_number" in update_data and not update_data["phone_number"]:
            raise ValidationError("phone_number is required")
        if "industry" in update_data and not update_data["industry"]:
            raise ValidationError("industry is required")

        # Email format validation
        if (
            "email" in update_data
            and update_data["email"]
            and "@" not in update_data["email"]
        ):
            raise ValidationError("Invalid email format")

        # Phone number basic validation
        if "phone_number" in update_data and update_data["phone_number"]:
            phone = (
                update_data["phone_number"]
                .replace("+", "")
                .replace("-", "")
                .replace(" ", "")
            )
            if not phone.isdigit() or len(phone) < 10:
                raise ValidationError("Invalid phone number format")

        # Create a mutable copy of the data
        data = dict(update_data)
        
        # Handle industry ID - convert to Industry instance if needed
        if "industry" in data and isinstance(data["industry"], str):
            from apps.companies.models import Industry
            try:
                industry = Industry.objects.get(id=data["industry"], is_deleted=False)
                data["industry"] = industry
            except Industry.DoesNotExist:
                raise ValidationError("Invalid industry ID")

        # Check for duplicates (excluding current company)
        if "company_name" in data or "email" in data:
            qs = Company.objects.filter(is_deleted=False).exclude(id=company_id)
            company_name = data.get("company_name", company.company_name)
            email = data.get("email", company.email)
            if qs.filter(
                Q(company_name__iexact=company_name) | Q(email__iexact=email)
            ).exists():
                raise ValidationError(
                    "Another company with this name or email already exists"
                )

        # Update fields
        for field, value in data.items():
            setattr(company, field, value)

        company.save()
        return company

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
        try:
            company = Company.objects.get(id=company_id, is_deleted=False)
        except Company.DoesNotExist as e:
            raise ValidationError("Company not found") from e

        company.status = BusinessStatusChoices.ACTIVE
        company.is_deleted = False
        company.deleted_at = None
        company.deleted_by = None
        company.save(update_fields=["status", "is_deleted", "deleted_at", "deleted_by"])
        return company

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
        try:
            company = Company.objects.get(id=company_id, is_deleted=False)
        except Company.DoesNotExist as e:
            raise ValidationError("Company not found") from e

        # Only change status to INACTIVE, don't soft-delete the record
        company.status = BusinessStatusChoices.INACTIVE
        company.save(update_fields=["status"])
        return company

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
        except Company.DoesNotExist as e:
            raise ValidationError("Company not found") from e

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
        try:
            company = Company.objects.get(id=company_id, is_deleted=False)
        except Company.DoesNotExist as e:
            raise ValidationError("Company not found") from e

        company.status = BusinessStatusChoices.SUSPENDED
        suspension_note = f"\nSuspended: {reason}"
        company.remark = (
            f"{company.remark}{suspension_note}"
            if company.remark
            else f"Suspended: {reason}"
        )
        company.save(update_fields=["status", "remark"])
        return company

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
        if new_status not in [choice[0] for choice in BusinessStatusChoices.choices]:
            raise ValidationError("Invalid status")

        updated_count = Company.objects.filter(
            id__in=company_ids, is_deleted=False
        ).update(status=new_status)

        return updated_count

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

        output = StringIO()
        writer = csv.writer(output)

        # Write header
        writer.writerow(
            [
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
        )

        # Write data
        for company in companies:
            writer.writerow(
                [
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
            )

        return output.getvalue()
