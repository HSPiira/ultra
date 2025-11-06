"""
Service layer for SchemePeriod write operations.

Handles scheme period creation, renewal, and updates.
"""
from decimal import Decimal
from django.core.exceptions import ValidationError
from django.db import models, transaction, IntegrityError
from django.utils import timezone

from apps.core.enums.choices import BusinessStatusChoices
from apps.core.exceptions.service_errors import (
    RequiredFieldError,
    NotFoundError,
    InvalidValueError,
    InactiveEntityError,
)
from apps.core.services import BaseService, RequiredFieldsRule, DateRangeRule
from apps.schemes.models import Scheme, SchemePeriod
from apps.schemes.selectors.scheme_period_selector import (
    scheme_period_get,
    scheme_period_current_get,
)


class SchemePeriodService(BaseService):
    """
    SchemePeriod business logic for write operations.

    Handles period creation, renewals, and updates while maintaining
    historical data integrity.
    """

    entity_model = SchemePeriod
    entity_name = "SchemePeriod"
    unique_fields = []  # Uniqueness is enforced via unique_together in model
    allowed_fields = {
        "scheme",
        "period_number",
        "start_date",
        "end_date",
        "termination_date",
        "limit_amount",
        "renewed_from",
        "renewal_date",
        "is_current",
        "changes_summary",
        "remark",
        "status",
    }
    validation_rules = [
        RequiredFieldsRule(
            ["scheme", "period_number", "start_date", "end_date", "limit_amount"],
            "SchemePeriod",
        ),
        DateRangeRule("start_date", "end_date"),
    ]

    # ---------------------------------------------------------------------
    # Period Creation
    # ---------------------------------------------------------------------

    @classmethod
    @transaction.atomic
    def scheme_period_create_initial(
        cls, *, scheme_id: str, period_data: dict, user=None
    ) -> SchemePeriod:
        """
        Create the initial period for a new scheme.

        This should be called when a new scheme is created.

        Args:
            scheme_id: ID of the scheme
            period_data: Dictionary containing period information
                - start_date (required)
                - end_date (required)
                - limit_amount (required)
                - remark (optional)
            user: User creating the period

        Returns:
            Created SchemePeriod instance

        Raises:
            NotFoundError: If scheme doesn't exist
            RequiredFieldError: If required field is missing
            InvalidValueError: If field value is invalid
            InactiveEntityError: If scheme is not active
        """
        # Get scheme
        try:
            scheme = Scheme.objects.select_for_update().get(id=scheme_id, is_deleted=False)
        except Scheme.DoesNotExist as exc:
            raise NotFoundError("Scheme", scheme_id) from exc

        if scheme.status != BusinessStatusChoices.ACTIVE:
            raise InactiveEntityError("Scheme", scheme_id)

        # Prepare period data
        period_data["scheme"] = scheme
        period_data["period_number"] = 1
        period_data["is_current"] = True
        period_data["renewed_from"] = None
        period_data["renewal_date"] = None

        # Filter and validate
        if cls.allowed_fields is not None:
            period_data = cls._filter_model_fields(period_data, cls.allowed_fields)

        cls._apply_validation_rules(period_data)

        # Create period
        try:
            period = SchemePeriod.objects.create(**period_data)
            return period
        except ValidationError as e:
            cls._handle_validation_error(e)
        except IntegrityError as e:
            cls._handle_integrity_error(e)

    @classmethod
    @transaction.atomic
    def scheme_period_renew(
        cls, *, scheme_id: str, renewal_data: dict, user=None
    ) -> SchemePeriod:
        """
        Renew a scheme by creating a new period.

        Marks the current period as non-current and creates a new period
        linked to the previous one. All historical data is preserved.

        Args:
            scheme_id: ID of the scheme to renew
            renewal_data: Dictionary containing new period information
                - start_date (required)
                - end_date (required)
                - limit_amount (optional, defaults to previous period's amount)
                - remark (optional)
            user: User performing the renewal

        Returns:
            New SchemePeriod instance

        Raises:
            NotFoundError: If scheme doesn't exist or has no current period
            RequiredFieldError: If required field is missing
            InvalidValueError: If dates are invalid
            InactiveEntityError: If scheme is not active
            ValidationError: If scheme is not renewable
        """
        # Get scheme and current period
        try:
            scheme = Scheme.objects.select_for_update().get(id=scheme_id, is_deleted=False)
        except Scheme.DoesNotExist as exc:
            raise NotFoundError("Scheme", scheme_id) from exc

        if scheme.status != BusinessStatusChoices.ACTIVE:
            raise InactiveEntityError("Scheme", scheme_id)

        if not scheme.is_renewable:
            raise ValidationError(
                f"Scheme {scheme.scheme_name} is not renewable. "
                "Set is_renewable=True to allow renewals."
            )

        current_period = scheme_period_current_get(scheme_id=scheme_id)
        if not current_period:
            raise NotFoundError(
                "Current Period",
                scheme_id,
                detail="Scheme has no current period. Use scheme_period_create_initial instead.",
            )

        # Validate renewal dates
        if "start_date" not in renewal_data:
            raise RequiredFieldError("start_date")
        if "end_date" not in renewal_data:
            raise RequiredFieldError("end_date")

        # Validate no date overlap with existing non-terminated periods
        overlapping = SchemePeriod.objects.filter(
            scheme=scheme,
            is_deleted=False,
            status=BusinessStatusChoices.ACTIVE
        ).filter(
            models.Q(termination_date__isnull=True) | models.Q(termination_date__gt=renewal_data["start_date"])
        ).filter(
            start_date__lte=renewal_data["end_date"],
            end_date__gte=renewal_data["start_date"]
        ).exclude(id=current_period.id if current_period else None)

        if overlapping.exists():
            overlapping_periods = list(overlapping.values_list('period_number', flat=True))
            raise ValidationError(
                f"New period dates ({renewal_data['start_date']} to {renewal_data['end_date']}) "
                f"overlap with existing non-terminated period(s): Period {', Period '.join(map(str, overlapping_periods))}. "
                f"Terminate overlapping periods first or adjust dates."
            )

        # Default limit_amount to previous period's amount
        if "limit_amount" not in renewal_data:
            renewal_data["limit_amount"] = current_period.limit_amount

        # Prepare new period data
        new_period_data = {
            "scheme": scheme,
            "period_number": current_period.period_number + 1,
            "start_date": renewal_data["start_date"],
            "end_date": renewal_data["end_date"],
            "limit_amount": renewal_data["limit_amount"],
            "renewed_from": current_period,
            "renewal_date": timezone.now().date(),
            "is_current": True,
            "remark": renewal_data.get("remark", ""),
            "status": BusinessStatusChoices.ACTIVE,
        }

        # Calculate changes from previous period
        changes = {}
        if current_period.limit_amount != new_period_data["limit_amount"]:
            changes["limit_amount"] = {
                "from": str(current_period.limit_amount),
                "to": str(new_period_data["limit_amount"]),
            }
        if current_period.start_date != new_period_data["start_date"]:
            changes["start_date"] = {
                "from": current_period.start_date.isoformat(),
                "to": new_period_data["start_date"].isoformat(),
            }
        if current_period.end_date != new_period_data["end_date"]:
            changes["end_date"] = {
                "from": current_period.end_date.isoformat(),
                "to": new_period_data["end_date"].isoformat(),
            }
        new_period_data["changes_summary"] = changes

        # Filter and validate
        if cls.allowed_fields is not None:
            new_period_data = cls._filter_model_fields(new_period_data, cls.allowed_fields)

        cls._apply_validation_rules(new_period_data)

        try:
            # Mark current period as non-current
            current_period.is_current = False
            current_period.save(update_fields=["is_current", "updated_at"])

            # Create new period
            new_period = SchemePeriod.objects.create(**new_period_data)
            return new_period
        except ValidationError as e:
            cls._handle_validation_error(e)
        except IntegrityError as e:
            cls._handle_integrity_error(e)

    # ---------------------------------------------------------------------
    # Period Updates
    # ---------------------------------------------------------------------

    @classmethod
    @transaction.atomic
    def scheme_period_update(
        cls, *, period_id: str, update_data: dict, user=None
    ) -> SchemePeriod:
        """
        Update an existing period.

        Note: Cannot update period_number, scheme, or renewed_from.

        Args:
            period_id: ID of the period to update
            update_data: Dictionary containing fields to update
            user: User performing the update

        Returns:
            Updated SchemePeriod instance

        Raises:
            NotFoundError: If period doesn't exist
            InvalidValueError: If attempting to update protected fields
        """
        period = scheme_period_get(period_id=period_id)

        # Protected fields that cannot be updated
        protected_fields = {"period_number", "scheme", "renewed_from", "renewal_date"}
        attempted_protected = protected_fields.intersection(update_data.keys())
        if attempted_protected:
            raise InvalidValueError(
                f"Cannot update protected fields: {', '.join(attempted_protected)}"
            )

        # Filter fields
        if cls.allowed_fields is not None:
            update_data = cls._filter_model_fields(update_data, cls.allowed_fields)

        # Merge with existing data for validation
        merged_data = {
            "scheme": period.scheme,
            "period_number": period.period_number,
            "start_date": getattr(period, "start_date"),
            "end_date": getattr(period, "end_date"),
            "limit_amount": getattr(period, "limit_amount"),
        }
        merged_data.update(update_data)

        cls._apply_validation_rules(merged_data, entity=period)

        # Update fields
        for field, value in update_data.items():
            setattr(period, field, value)

        try:
            period.save()
            return period
        except ValidationError as e:
            cls._handle_validation_error(e)
        except IntegrityError as e:
            cls._handle_integrity_error(e)

    # ---------------------------------------------------------------------
    # Period Termination
    # ---------------------------------------------------------------------

    @classmethod
    @transaction.atomic
    def scheme_period_terminate(
        cls, *, period_id: str, reason: str = None, user=None
    ) -> SchemePeriod:
        """
        Terminate a period before its end date.

        Args:
            period_id: ID of the period to terminate
            reason: Reason for termination
            user: User performing the termination

        Returns:
            Terminated SchemePeriod instance
        """
        period = scheme_period_get(period_id=period_id)
        period.terminate(reason=reason, user=user)
        return period

    @classmethod
    @transaction.atomic
    def scheme_period_activate(cls, *, period_id: str, user=None) -> SchemePeriod:
        """
        Reactivate a terminated or inactive period.

        Args:
            period_id: ID of the period to activate
            user: User performing the activation

        Returns:
            Activated SchemePeriod instance
        """
        return cls.activate(entity_id=period_id, user=user)

    # ---------------------------------------------------------------------
    # Item Management
    # ---------------------------------------------------------------------

    @classmethod
    @transaction.atomic
    def scheme_period_renew_with_items(
        cls,
        *,
        scheme_id: str,
        renewal_data: dict,
        copy_items: bool = True,
        item_modifications: dict = None,
        filter_content_types: list = None,
        exclude_object_ids: list = None,
        user=None,
    ) -> SchemePeriod:
        """
        Renew scheme period and optionally copy items from previous period.

        Args:
            scheme_id: Scheme to renew
            renewal_data: New period data (dates, limit_amount)
            copy_items: Whether to copy items from previous period
            item_modifications: Optional dict of field changes to apply to copied items
                e.g., {"copayment_percent": Decimal("15.00")}
            filter_content_types: Only copy items with these content types
            exclude_object_ids: Exclude items with these object IDs
            user: User performing renewal

        Returns:
            New SchemePeriod instance with items copied if requested
        """
        from apps.schemes.services.scheme_item_service import SchemeItemService
        from apps.schemes.selectors.scheme_period_selector import scheme_period_current_get

        # Get current period before renewal
        current_period = scheme_period_current_get(scheme_id=scheme_id)

        # Create new period
        new_period = cls.scheme_period_renew(
            scheme_id=scheme_id, renewal_data=renewal_data, user=user
        )

        # Copy items if requested and current period exists
        if copy_items and current_period:
            SchemeItemService.scheme_items_copy_from_period(
                source_period_id=current_period.id,
                target_period_id=new_period.id,
                item_modifications=item_modifications,
                filter_content_types=filter_content_types,
                exclude_object_ids=exclude_object_ids,
                user=user,
            )

        return new_period

    # ---------------------------------------------------------------------
    # Renewal Readiness Validation
    # ---------------------------------------------------------------------

    @classmethod
    def validate_renewal_readiness(cls, *, scheme_id: str) -> dict:
        """
        Check if a scheme is ready for renewal.

        Validates that the scheme can be renewed and provides warnings
        about timing and potential issues.

        Args:
            scheme_id: Scheme ID to validate

        Returns:
            Dictionary with readiness status:
                - ready (bool): Whether scheme can be renewed
                - reason (str): Reason if not ready
                - current_period (int): Current period number
                - days_until_expiry (int): Days until current period expires
                - warnings (list): List of warning messages
                - scheme_name (str): Name of the scheme

        Example:
            >>> result = SchemePeriodService.validate_renewal_readiness(scheme_id="scheme_id")
            >>> if result["ready"]:
            ...     print(f"Ready to renew with {result['warnings']}")
            ... else:
            ...     print(f"Cannot renew: {result['reason']}")
        """
        from datetime import timedelta

        # Get current period
        current_period = scheme_period_current_get(scheme_id=scheme_id)

        if not current_period:
            return {
                "ready": False,
                "reason": "No current period exists for this scheme",
                "current_period": None,
                "days_until_expiry": None,
                "warnings": [],
                "scheme_name": None,
            }

        scheme = current_period.scheme

        # Check if scheme is renewable
        if not scheme.is_renewable:
            return {
                "ready": False,
                "reason": "Scheme is marked as non-renewable",
                "current_period": current_period.period_number,
                "days_until_expiry": (current_period.end_date - timezone.now().date()).days,
                "warnings": [],
                "scheme_name": scheme.scheme_name,
            }

        # Check if scheme is active
        if scheme.status != BusinessStatusChoices.ACTIVE:
            return {
                "ready": False,
                "reason": f"Scheme is not active (status: {scheme.status})",
                "current_period": current_period.period_number,
                "days_until_expiry": (current_period.end_date - timezone.now().date()).days,
                "warnings": [],
                "scheme_name": scheme.scheme_name,
            }

        # Calculate days until expiry
        today = timezone.now().date()
        days_until_expiry = (current_period.end_date - today).days

        # Collect warnings
        warnings = []

        if days_until_expiry > 90:
            warnings.append(
                f"Renewal is {days_until_expiry} days before expiry. "
                "Consider renewing closer to the expiry date."
            )
        elif days_until_expiry < 0:
            warnings.append(
                f"Period expired {abs(days_until_expiry)} days ago. "
                "This is a late renewal."
            )
        elif days_until_expiry <= 7:
            warnings.append(
                f"Period expires in {days_until_expiry} days. "
                "Urgent renewal recommended."
            )

        # Check if current period is terminated
        if current_period.status != BusinessStatusChoices.ACTIVE:
            warnings.append(
                f"Current period is {current_period.status}. "
                "Renewing a non-active period may require additional review."
            )

        # Check if there are items to copy
        items_count = current_period.items.filter(is_deleted=False).count()
        if items_count == 0:
            warnings.append(
                "Current period has no items. "
                "You'll need to manually add items to the new period."
            )

        return {
            "ready": True,
            "reason": None,
            "current_period": current_period.period_number,
            "days_until_expiry": days_until_expiry,
            "warnings": warnings,
            "scheme_name": scheme.scheme_name,
            "current_period_start": current_period.start_date,
            "current_period_end": current_period.end_date,
            "items_count": items_count,
        }
