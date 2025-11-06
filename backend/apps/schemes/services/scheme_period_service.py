"""
Service layer for SchemePeriod write operations.

Handles scheme period creation, renewal, and updates.
"""
import logging
from decimal import Decimal
from django.core.exceptions import ValidationError
from django.db import models, transaction, IntegrityError
from django.utils import timezone

# Set up logger for audit trail
logger = logging.getLogger(__name__)

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

        # Lock current period to prevent race conditions during renewal
        current_period = SchemePeriod.objects.select_for_update().filter(
            scheme_id=scheme_id,
            is_current=True,
            is_deleted=False,
            status=BusinessStatusChoices.ACTIVE
        ).first()

        if not current_period:
            raise NotFoundError(
                "Current Period",
                scheme_id,
                detail="Scheme has no current period. Use scheme_period_create_initial instead.",
            )

        # Validate current period is active (not terminated)
        if current_period.status != BusinessStatusChoices.ACTIVE:
            raise ValidationError(
                f"Cannot renew from a {current_period.status} period. "
                f"Current period (Period {current_period.period_number}) must be ACTIVE to renew. "
                f"Reactivate the period first or create a new initial period."
            )

        # Validate renewal dates
        if "start_date" not in renewal_data:
            raise RequiredFieldError("start_date")
        if "end_date" not in renewal_data:
            raise RequiredFieldError("end_date")

        # Collect warnings for review
        renewal_warnings = []

        # Check for period gap (warning, not error)
        from datetime import timedelta
        expected_start = current_period.end_date + timedelta(days=1)
        if renewal_data["start_date"] > expected_start:
            gap_days = (renewal_data["start_date"] - current_period.end_date).days - 1
            renewal_warnings.append(
                f"Gap of {gap_days} day(s) between current period end ({current_period.end_date}) "
                f"and new period start ({renewal_data['start_date']}). "
                f"Consider adjusting dates to avoid coverage gaps."
            )
        elif renewal_data["start_date"] <= current_period.end_date:
            # Early renewal - overlaps with current period
            overlap_days = (current_period.end_date - renewal_data["start_date"]).days + 1
            renewal_warnings.append(
                f"Early renewal: New period starts {overlap_days} day(s) before current period ends. "
                f"Current period will be marked as non-current. Consider terminating current period first."
            )

        # Store warnings in remark if provided
        if renewal_warnings and not renewal_data.get("remark"):
            renewal_data["remark"] = "\n".join(renewal_warnings)
        elif renewal_warnings and renewal_data.get("remark"):
            renewal_data["remark"] = f"{renewal_data['remark']}\n\nWarnings:\n" + "\n".join(renewal_warnings)

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
        expected_period_number = current_period.period_number + 1
        new_period_data = {
            "scheme": scheme,
            "period_number": expected_period_number,
            "start_date": renewal_data["start_date"],
            "end_date": renewal_data["end_date"],
            "limit_amount": renewal_data["limit_amount"],
            "renewed_from": current_period,
            "renewal_date": timezone.now().date(),
            "is_current": True,
            "remark": renewal_data.get("remark", ""),
            "status": BusinessStatusChoices.ACTIVE,
        }

        # Validate period_number sequence (in case it was manually provided)
        if "period_number" in renewal_data and renewal_data["period_number"] != expected_period_number:
            raise ValidationError(
                f"Period number must be {expected_period_number} "
                f"(current period is {current_period.period_number}). "
                f"Period numbers are automatically assigned and must be sequential."
            )

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

            # Audit log for successful renewal
            logger.info(
                f"Scheme renewed successfully: {scheme.scheme_name}",
                extra={
                    "action": "scheme_period_renew",
                    "scheme_id": scheme.id,
                    "scheme_name": scheme.scheme_name,
                    "old_period_id": current_period.id,
                    "old_period_number": current_period.period_number,
                    "new_period_id": new_period.id,
                    "new_period_number": new_period.period_number,
                    "new_start_date": new_period.start_date.isoformat(),
                    "new_end_date": new_period.end_date.isoformat(),
                    "new_limit_amount": str(new_period.limit_amount),
                    "user_id": user.id if user and hasattr(user, 'id') else None,
                    "changes": new_period.changes_summary,
                },
            )

            return new_period
        except ValidationError as e:
            # Log validation errors
            logger.warning(
                f"Scheme renewal validation failed: {scheme.scheme_name}",
                extra={
                    "action": "scheme_period_renew_failed",
                    "scheme_id": scheme.id,
                    "error_type": "ValidationError",
                    "error_message": str(e),
                    "user_id": user.id if user and hasattr(user, 'id') else None,
                },
            )
            cls._handle_validation_error(e)
        except IntegrityError as e:
            # Log integrity errors
            logger.error(
                f"Scheme renewal integrity error: {scheme.scheme_name}",
                extra={
                    "action": "scheme_period_renew_failed",
                    "scheme_id": scheme.id,
                    "error_type": "IntegrityError",
                    "error_message": str(e),
                    "user_id": user.id if user and hasattr(user, 'id') else None,
                },
            )
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

        # Validate is_current changes to prevent incorrect updates
        if "is_current" in update_data and update_data["is_current"] != period.is_current:
            if update_data["is_current"] is True:
                # Trying to set this period as current
                # Check if another period is already current
                existing_current = SchemePeriod.objects.filter(
                    scheme=period.scheme,
                    is_current=True,
                    is_deleted=False
                ).exclude(id=period.id)

                if existing_current.exists():
                    current_period = existing_current.first()
                    raise ValidationError(
                        f"Cannot set Period {period.period_number} as current. "
                        f"Period {current_period.period_number} is already marked as current for this scheme. "
                        f"Use the renewal process (scheme_period_renew) to create a new current period, "
                        f"or manually mark the existing current period as non-current first."
                    )
            else:
                # Trying to mark current period as non-current
                # This should only be done through renewal process
                raise ValidationError(
                    "Cannot manually mark a period as non-current. "
                    "Use the renewal process (scheme_period_renew) to create a new period, "
                    "or use scheme_period_terminate to terminate the period."
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

    # ---------------------------------------------------------------------
    # Bulk Operations
    # ---------------------------------------------------------------------

    @classmethod
    @transaction.atomic
    def scheme_period_bulk_renew(
        cls, *, scheme_ids: list[str], renewal_data_template: dict, user=None
    ) -> dict:
        """
        Renew multiple schemes in a single transaction.

        Useful for renewing multiple schemes at once with the same renewal parameters.
        Each scheme renewal is independent - if one fails, it's recorded but doesn't
        affect others.

        Args:
            scheme_ids: List of scheme IDs to renew
            renewal_data_template: Template for renewal data applied to all schemes
                - start_date, end_date, limit_amount, remark, etc.
            user: User performing the bulk renewal

        Returns:
            Dictionary with results:
                - success: List of successfully renewed schemes with details
                - failed: List of failed schemes with error messages
                - summary: Count of successes and failures

        Example:
            >>> results = SchemePeriodService.scheme_period_bulk_renew(
            ...     scheme_ids=["scheme1_id", "scheme2_id", "scheme3_id"],
            ...     renewal_data_template={
            ...         "start_date": date(2026, 1, 1),
            ...         "end_date": date(2026, 12, 31),
            ...         "remark": "Annual renewal 2026"
            ...     },
            ...     user=request.user
            ... )
            >>> print(f"Success: {results['summary']['success_count']}, "
            ...       f"Failed: {results['summary']['failed_count']}")
        """
        results = {"success": [], "failed": []}

        for scheme_id in scheme_ids:
            try:
                # Create a copy of the template for this scheme
                renewal_data = renewal_data_template.copy()

                # Perform renewal
                new_period = cls.scheme_period_renew(
                    scheme_id=scheme_id, renewal_data=renewal_data, user=user
                )

                results["success"].append(
                    {
                        "scheme_id": scheme_id,
                        "scheme_name": new_period.scheme.scheme_name,
                        "period_id": new_period.id,
                        "period_number": new_period.period_number,
                        "start_date": new_period.start_date,
                        "end_date": new_period.end_date,
                    }
                )

            except Exception as e:
                results["failed"].append(
                    {"scheme_id": scheme_id, "error": str(e), "error_type": type(e).__name__}
                )

        # Add summary
        results["summary"] = {
            "total": len(scheme_ids),
            "success_count": len(results["success"]),
            "failed_count": len(results["failed"]),
        }

        return results

    # ---------------------------------------------------------------------
    # Renewal Suggestions and Checks
    # ---------------------------------------------------------------------

    @classmethod
    def suggest_next_renewal_dates(
        cls, *, scheme_id: str, duration_days: int = 365
    ) -> dict:
        """
        Suggest dates for the next renewal based on current period.

        Calculates appropriate start and end dates for the next renewal period,
        taking into account the current period's end date.

        Args:
            scheme_id: Scheme ID
            duration_days: Duration of next period in days (default: 365)

        Returns:
            Dictionary with suggested dates:
                - suggested_start_date: Recommended start date (day after current ends)
                - suggested_end_date: Recommended end date
                - duration_days: Duration of suggested period
                - current_period_end: Current period's end date
                - error: Error message if no current period exists

        Example:
            >>> suggestion = SchemePeriodService.suggest_next_renewal_dates(
            ...     scheme_id="scheme_id",
            ...     duration_days=365
            ... )
            >>> print(f"Next period: {suggestion['suggested_start_date']} "
            ...       f"to {suggestion['suggested_end_date']}")
        """
        from datetime import timedelta

        current_period = scheme_period_current_get(scheme_id=scheme_id)

        if not current_period:
            return {
                "error": "No current period exists for this scheme",
                "scheme_id": scheme_id,
            }

        # Suggest starting the day after current period ends
        suggested_start = current_period.end_date + timedelta(days=1)
        suggested_end = suggested_start + timedelta(days=duration_days - 1)

        return {
            "suggested_start_date": suggested_start,
            "suggested_end_date": suggested_end,
            "duration_days": duration_days,
            "current_period_number": current_period.period_number,
            "current_period_end": current_period.end_date,
            "scheme_name": current_period.scheme.scheme_name,
        }

    @classmethod
    def is_renewal_overdue(cls, *, scheme_id: str) -> dict:
        """
        Check if scheme renewal is overdue.

        Determines if the current period has expired and provides details
        about how overdue the renewal is.

        Args:
            scheme_id: Scheme ID to check

        Returns:
            Dictionary with overdue status:
                - overdue: Boolean indicating if renewal is overdue
                - days_overdue: Number of days past the end date (0 if not overdue)
                - current_period_end: End date of current period
                - scheme_name: Name of the scheme
                - reason: Reason if not applicable

        Example:
            >>> status = SchemePeriodService.is_renewal_overdue(scheme_id="scheme_id")
            >>> if status["overdue"]:
            ...     print(f"Renewal is {status['days_overdue']} days overdue!")
        """
        current_period = scheme_period_current_get(scheme_id=scheme_id)

        if not current_period:
            return {
                "overdue": False,
                "days_overdue": 0,
                "reason": "No current period exists for this scheme",
                "scheme_id": scheme_id,
            }

        today = timezone.now().date()
        days_overdue = (today - current_period.end_date).days

        return {
            "overdue": days_overdue > 0,
            "days_overdue": max(0, days_overdue),
            "current_period_end": current_period.end_date,
            "current_period_number": current_period.period_number,
            "scheme_name": current_period.scheme.scheme_name,
            "scheme_id": scheme_id,
        }
