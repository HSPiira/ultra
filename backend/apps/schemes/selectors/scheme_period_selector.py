"""
Selectors for SchemePeriod read operations.

All read-only query operations for scheme periods.
"""
from typing import Optional
from django.db.models import QuerySet, Q, Count, Sum, Avg
from django.utils import timezone

from apps.schemes.models import SchemePeriod
from apps.core.enums.choices import BusinessStatusChoices
from apps.core.exceptions.service_errors import NotFoundError


def scheme_period_list(*, filters: Optional[dict] = None) -> QuerySet[SchemePeriod]:
    """
    Get a list of scheme periods with optional filtering.

    Args:
        filters: Optional dictionary of filter parameters
            - scheme_id: Filter by scheme
            - is_current: Filter by current status
            - status: Filter by business status
            - period_number: Filter by period number
            - start_date__gte: Start date greater than or equal
            - end_date__lte: End date less than or equal

    Returns:
        QuerySet of SchemePeriod objects
    """
    qs = SchemePeriod.objects.filter(is_deleted=False).select_related("scheme", "scheme__company")

    if not filters:
        return qs

    # Apply filters
    if filters.get("scheme_id"):
        qs = qs.filter(scheme_id=filters["scheme_id"])

    if filters.get("is_current") is not None:
        qs = qs.filter(is_current=filters["is_current"])

    if filters.get("status"):
        qs = qs.filter(status=filters["status"])

    if filters.get("period_number"):
        qs = qs.filter(period_number=filters["period_number"])

    if filters.get("start_date__gte"):
        qs = qs.filter(start_date__gte=filters["start_date__gte"])

    if filters.get("end_date__lte"):
        qs = qs.filter(end_date__lte=filters["end_date__lte"])

    return qs


def scheme_period_get(*, period_id: str) -> SchemePeriod:
    """
    Get a single scheme period by ID.

    Args:
        period_id: SchemePeriod ID

    Returns:
        SchemePeriod object

    Raises:
        NotFoundError: If period doesn't exist
    """
    try:
        return (
            SchemePeriod.objects.filter(is_deleted=False)
            .select_related("scheme", "scheme__company", "renewed_from")
            .get(id=period_id)
        )
    except SchemePeriod.DoesNotExist as exc:
        raise NotFoundError("SchemePeriod", period_id) from exc


def scheme_period_current_get(*, scheme_id: str) -> Optional[SchemePeriod]:
    """
    Get the current active period for a scheme.

    Args:
        scheme_id: Scheme ID

    Returns:
        Current SchemePeriod or None if no current period
    """
    return (
        SchemePeriod.objects.filter(
            scheme_id=scheme_id, is_current=True, is_deleted=False, status=BusinessStatusChoices.ACTIVE
        )
        .select_related("scheme", "scheme__company")
        .first()
    )


def scheme_period_on_date_get(*, scheme_id: str, when_date) -> Optional[SchemePeriod]:
    """
    Get the period that was active on a specific date.

    Args:
        scheme_id: Scheme ID
        when_date: Date to check

    Returns:
        SchemePeriod that was active on the date, or None
    """
    return (
        SchemePeriod.objects.filter(scheme_id=scheme_id, is_deleted=False)
        .filter(start_date__lte=when_date)
        .filter(Q(termination_date__isnull=True) | Q(termination_date__gt=when_date))
        .select_related("scheme", "scheme__company")
        .first()
    )


def scheme_period_list_by_scheme(*, scheme_id: str) -> QuerySet[SchemePeriod]:
    """
    Get all periods for a specific scheme, ordered by period number (newest first).

    Args:
        scheme_id: Scheme ID

    Returns:
        QuerySet of SchemePeriod objects
    """
    return (
        SchemePeriod.objects.filter(scheme_id=scheme_id, is_deleted=False)
        .select_related("scheme", "scheme__company", "renewed_from")
        .order_by("-period_number")
    )


def scheme_period_renewal_chain_get(*, period_id: str) -> list[SchemePeriod]:
    """
    Get the complete renewal chain for a period (from earliest to latest).

    Args:
        period_id: SchemePeriod ID

    Returns:
        List of SchemePeriod objects in chronological order
    """
    period = scheme_period_get(period_id=period_id)
    chain = [period]

    # Walk backwards to find the original period
    current = period
    while current.renewed_from:
        current = current.renewed_from
        chain.insert(0, current)

    # Walk forwards to find all renewals
    current = period
    renewals = list(current.renewed_to.filter(is_deleted=False).order_by("period_number"))
    while renewals:
        next_period = renewals[0]
        chain.append(next_period)
        current = next_period
        renewals = list(current.renewed_to.filter(is_deleted=False).order_by("period_number"))

    return chain


def scheme_period_statistics_get(*, scheme_id: str) -> dict:
    """
    Get statistics for all periods of a scheme.

    Args:
        scheme_id: Scheme ID

    Returns:
        Dictionary with period statistics
    """
    periods = SchemePeriod.objects.filter(scheme_id=scheme_id, is_deleted=False)

    stats = periods.aggregate(
        total_periods=Count("id"),
        avg_limit_amount=Avg("limit_amount"),
        total_coverage=Sum("limit_amount"),
    )

    current_period = scheme_period_current_get(scheme_id=scheme_id)

    return {
        "scheme_id": scheme_id,
        "total_periods": stats["total_periods"] or 0,
        "average_limit_amount": float(stats["avg_limit_amount"] or 0),
        "total_coverage_across_periods": float(stats["total_coverage"] or 0),
        "current_period_id": current_period.id if current_period else None,
        "current_period_number": current_period.period_number if current_period else None,
        "current_limit_amount": float(current_period.limit_amount) if current_period else None,
        "has_been_renewed": stats["total_periods"] > 1 if stats["total_periods"] else False,
    }


def scheme_period_expiring_soon(*, days: int = 30) -> QuerySet[SchemePeriod]:
    """
    Get current periods expiring within the specified number of days.

    Args:
        days: Number of days to look ahead (default: 30)

    Returns:
        QuerySet of SchemePeriod objects expiring soon
    """
    from datetime import timedelta

    today = timezone.now().date()
    expiry_date = today + timedelta(days=days)

    return (
        SchemePeriod.objects.filter(
            is_current=True,
            is_deleted=False,
            status=BusinessStatusChoices.ACTIVE,
            end_date__gte=today,
            end_date__lte=expiry_date,
        )
        .select_related("scheme", "scheme__company")
        .order_by("end_date")
    )


def scheme_period_items_compare(*, period1_id: str, period2_id: str) -> dict:
    """
    Compare what changed between two scheme periods.

    Analyzes items (hospitals, services, etc.) between two periods to identify:
    - Items added in period2
    - Items removed from period1
    - Items kept in both periods

    Args:
        period1_id: First (usually older) period ID
        period2_id: Second (usually newer) period ID

    Returns:
        Dictionary with comparison statistics:
            - added: Count of new items in period2
            - removed: Count of items no longer in period2
            - kept: Count of items in both periods
            - total_period1: Total items in period1
            - total_period2: Total items in period2
            - added_items: List of (content_type_id, object_id) tuples for added items
            - removed_items: List of (content_type_id, object_id) tuples for removed items

    Example:
        >>> comparison = scheme_period_items_compare(
        ...     period1_id="old_period_id",
        ...     period2_id="new_period_id"
        ... )
        >>> print(f"Added {comparison['added']} items, removed {comparison['removed']} items")
    """
    from apps.schemes.models import SchemeItem

    # Get items for both periods (content_type + object_id tuples)
    items1 = set(
        SchemeItem.objects.filter(
            scheme_period_id=period1_id, is_deleted=False
        ).values_list("content_type_id", "object_id")
    )

    items2 = set(
        SchemeItem.objects.filter(
            scheme_period_id=period2_id, is_deleted=False
        ).values_list("content_type_id", "object_id")
    )

    # Calculate differences
    added = items2 - items1
    removed = items1 - items2
    kept = items1 & items2

    return {
        "added": len(added),
        "removed": len(removed),
        "kept": len(kept),
        "total_period1": len(items1),
        "total_period2": len(items2),
        "added_items": list(added),
        "removed_items": list(removed),
    }
