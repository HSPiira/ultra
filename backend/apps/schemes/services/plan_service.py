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
from apps.core.utils.validation import validate_required_fields, validate_string_length
from apps.schemes.models import Plan


class PlanService(BaseService, CSVExportMixin):
    """
    Plan business logic for write operations.
    Handles all plan-related write operations including CRUD, validation,
    and business logic. Read operations are handled by selectors.
    
    Uses SOLID improvements:
    - Validation rules for extensible validation (OCP)
    - Standardized method signatures available (ISP)
    """
    
    # BaseService configuration
    entity_model = Plan
    entity_name = "Plan"
    unique_fields = ["plan_name"]
    allowed_fields = {'plan_name', 'description', 'status'}
    validation_rules = [
        RequiredFieldsRule(["plan_name"], "Plan"),
        StringLengthRule("plan_name", min_length=2, max_length=255),
        StringLengthRule("description", max_length=500, min_length=None),
    ]

    # ---------------------------------------------------------------------
    # Basic CRUD Operations
    # ---------------------------------------------------------------------

    @classmethod
    @transaction.atomic
    def plan_create(cls, *, plan_data: dict, user=None):
        """
        Create a new plan with validation and duplicate checking.

        Args:
            plan_data: Dictionary containing plan information
            user: User creating the plan (for audit trail)

        Returns:
            Plan: The created plan instance

        Raises:
            ValidationError: If data is invalid or duplicates exist
        """
        # Filter fields if allowed_fields is defined
        if cls.allowed_fields is not None:
            plan_data = cls._filter_model_fields(plan_data, cls.allowed_fields)
        
        # Apply validation rules (configured in BaseService)
        cls._apply_validation_rules(plan_data)
        
        # Trim plan name
        if "plan_name" in plan_data:
            plan_data["plan_name"] = plan_data.get("plan_name", "").strip()

        # Create plan - database unique constraints prevent duplicates atomically
        try:
            plan = Plan.objects.create(**plan_data)
            return plan
        except ValidationError as e:
            cls._handle_validation_error(e)
        except IntegrityError as e:
            cls._handle_integrity_error(e)

    @classmethod
    @transaction.atomic
    def plan_update(cls, *, plan_id: str, update_data: dict, user=None):
        """
        Update plan with validation and duplicate checking.

        Args:
            plan_id: ID of the plan to update
            update_data: Dictionary containing fields to update
            user: User performing the update (for audit trail)

        Returns:
            Plan: The updated plan instance

        Raises:
            ValidationError: If data is invalid or duplicates exist
        """
        # Get plan using base method
        plan = cls._get_entity(plan_id)
        
        # Filter fields if allowed_fields is defined
        if cls.allowed_fields is not None:
            update_data = cls._filter_model_fields(update_data, cls.allowed_fields)
        
        # Merge with existing data for validation (required fields must be present)
        merged_data = {}
        for field in cls.allowed_fields:
            if hasattr(plan, field):
                merged_data[field] = getattr(plan, field)
        merged_data.update(update_data)
        
        # Apply validation rules (configured in BaseService)
        cls._apply_validation_rules(merged_data, entity=plan)
        
        # Trim plan name if being updated
        if "plan_name" in update_data:
            merged_data["plan_name"] = merged_data.get("plan_name", "").strip()
            update_data["plan_name"] = merged_data["plan_name"]

        # Update fields
        for field, value in update_data.items():
            setattr(plan, field, value)

        # Save - database constraints will prevent duplicates atomically
        try:
            plan.save()
            return plan
        except ValidationError as e:
            cls._handle_validation_error(e)
        except IntegrityError as e:
            cls._handle_integrity_error(e)

    # ---------------------------------------------------------------------
    # Status Management
    # ---------------------------------------------------------------------

    @classmethod
    @transaction.atomic
    def plan_activate(cls, *, plan_id: str, user=None):
        """
        Reactivate a previously deactivated plan.

        Args:
            plan_id: ID of the plan to activate
            user: User performing the activation

        Returns:
            Plan: The activated plan instance
        """
        return cls.activate(entity_id=plan_id, user=user)

    @classmethod
    @transaction.atomic
    def plan_deactivate(cls, *, plan_id: str, user=None):
        """
        Soft delete / deactivate plan.

        Args:
            plan_id: ID of the plan to deactivate
            user: User performing the deactivation

        Returns:
            Plan: The deactivated plan instance
        """
        return cls.deactivate(entity_id=plan_id, user=user, soft_delete=True)

    @classmethod
    @transaction.atomic
    def plan_suspend(cls, *, plan_id: str, reason: str, user=None):
        """
        Suspend a plan with reason tracking.

        Args:
            plan_id: ID of the plan to suspend
            reason: Reason for suspension
            user: User performing the suspension

        Returns:
            Plan: The suspended plan instance
        """
        return cls.suspend(entity_id=plan_id, reason=reason, user=user)

    # ---------------------------------------------------------------------
    # Bulk Operations
    # ---------------------------------------------------------------------

    @staticmethod
    @transaction.atomic
    def plans_bulk_status_update(*, plan_ids: list, new_status: str, user=None):
        """
        Bulk update plan status.

        Args:
            plan_ids: List of plan IDs to update
            new_status: New status to set
            user: User performing the update

        Returns:
            int: Number of plans updated
        """
        return PlanService.bulk_status_update(
            entity_ids=plan_ids,
            new_status=new_status,
            user=user
        )

    @staticmethod
    def plans_export_csv(*, filters: dict = None):
        """
        Export filtered plans to CSV format.

        Args:
            filters: Optional filters to apply

        Returns:
            str: CSV content as string
        """
        from apps.schemes.selectors import plan_list

        if filters:
            plans = plan_list(filters=filters)
        else:
            plans = Plan.objects.filter(is_deleted=False)

        headers = ["ID", "Plan Name", "Description", "Status", "Created At", "Updated At"]

        def row_extractor(plan):
            return [
                plan.id,
                plan.plan_name,
                plan.description or "",
                plan.status,
                plan.created_at.strftime("%Y-%m-%d %H:%M:%S"),
                plan.updated_at.strftime("%Y-%m-%d %H:%M:%S"),
            ]

        return PlanService.export_to_csv(plans, headers, row_extractor)
