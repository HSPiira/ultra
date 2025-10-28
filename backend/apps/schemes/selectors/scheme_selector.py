
from django.db import models
from django.db.models import Count, Q
from django.utils import timezone

from apps.core.enums.choices import BusinessStatusChoices
from apps.schemes.models import Scheme

# ---------------------------------------------------------------------
# Scheme Selectors
# ---------------------------------------------------------------------


def scheme_list(*, filters: dict = None):
    """
    Get filtered list of schemes.

    Args:
        filters: Dictionary containing filter criteria

    Returns:
        QuerySet: Filtered scheme queryset
    """
    qs = Scheme.objects.select_related("company").filter(is_deleted=False)

    if not filters:
        return qs

    if filters.get("status"):
        qs = qs.filter(status=filters["status"])

    if filters.get("company"):
        qs = qs.filter(company_id=filters["company"])

    if filters.get("query"):
        q = filters["query"]
        qs = qs.filter(
            Q(scheme_name__icontains=q)
            | Q(description__icontains=q)
            | Q(card_code__icontains=q)
        )

    return qs


def scheme_get(*, scheme_id: str):
    """
    Get a single scheme by ID.

    Args:
        scheme_id: ID of the scheme

    Returns:
        Scheme: Scheme instance or None
    """
    try:
        return Scheme.objects.select_related("company").get(
            id=scheme_id, is_deleted=False
        )
    except Scheme.DoesNotExist:
        return None


def scheme_list_by_company(*, company_id: str):
    """
    Get all schemes for a specific company.

    Args:
        company_id: ID of the company

    Returns:
        QuerySet: Schemes for the specified company
    """
    return Scheme.objects.select_related("company").filter(
        company_id=company_id, is_deleted=False
    )


def scheme_statistics_get():
    """
    Get comprehensive scheme statistics.

    Returns:
        dict: Scheme statistics
    """
    stats = Scheme.objects.filter(is_deleted=False).aggregate(
        total_schemes=Count("id"),
        active_schemes=Count("id", filter=Q(status=BusinessStatusChoices.ACTIVE)),
        inactive_schemes=Count("id", filter=Q(status=BusinessStatusChoices.INACTIVE)),
        suspended_schemes=Count("id", filter=Q(status=BusinessStatusChoices.SUSPENDED)),
    )

    # Add company breakdown
    company_stats = (
        Scheme.objects.filter(is_deleted=False)
        .values("company__company_name")
        .annotate(count=Count("id"))
        .order_by("-count")
    )

    stats["by_company"] = list(company_stats)

    return stats


def scheme_health_score_get(*, scheme_id: str):
    """
    Calculate scheme health score based on various factors.

    Args:
        scheme_id: ID of the scheme

    Returns:
        dict: Health score and factors or None
    """
    scheme = scheme_get(scheme_id=scheme_id)
    if not scheme:
        return None

    score = 0
    factors = {}

    # Status factor (40 points)
    if scheme.status == BusinessStatusChoices.ACTIVE:
        score += 40
        factors["status"] = "Active"
    elif scheme.status == BusinessStatusChoices.SUSPENDED:
        score += 20
        factors["status"] = "Suspended"
    else:
        score += 0
        factors["status"] = "Inactive"

    # Date validity factor (30 points)
    today = timezone.now().date()
    if scheme.start_date <= today <= scheme.end_date:
        score += 30
        factors["date_validity"] = "Currently active"
    elif today < scheme.start_date:
        score += 20
        factors["date_validity"] = "Future start date"
    elif today > scheme.end_date:
        score += 0
        factors["date_validity"] = "Expired"

    # Items factor (20 points)
    items_count = scheme.items.filter(is_deleted=False).count()
    if items_count > 0:
        score += min(20, items_count * 5)  # 5 points per item, max 20
        factors["items"] = f"{items_count} items"
    else:
        factors["items"] = "No items"

    # Description completeness factor (10 points)
    if scheme.description and len(scheme.description.strip()) > 10:
        score += 10
        factors["description"] = "Complete description"
    elif scheme.description:
        score += 5
        factors["description"] = "Partial description"
    else:
        factors["description"] = "No description"

    return {
        "score": min(100, score),
        "factors": factors,
        "grade": (
            "A" if score >= 80 else "B" if score >= 60 else "C" if score >= 40 else "D"
        ),
    }


def scheme_health_scores_list():
    """
    Get health scores for all schemes.

    Returns:
        list: List of health score data
    """
    schemes = scheme_list()
    health_data = []

    for scheme in schemes:
        health_score = scheme_health_score_get(scheme_id=scheme.id)
        if health_score:
            health_data.append(
                {
                    "scheme_id": scheme.id,
                    "scheme_name": scheme.scheme_name,
                    "health_score": health_score,
                }
            )

    return health_data


def scheme_list_needing_attention():
    """
    Get schemes that need attention (expired, missing items, etc.).

    Returns:
        QuerySet: Schemes needing attention
    """
    today = timezone.now().date()

    # Expired schemes
    expired_schemes = Scheme.objects.filter(is_deleted=False, end_date__lt=today)

    # Schemes with suspended status
    suspended_schemes = Scheme.objects.filter(
        is_deleted=False, status=BusinessStatusChoices.SUSPENDED
    )

    # Schemes with no items
    schemes_no_items = Scheme.objects.filter(is_deleted=False, items__isnull=True)

    # Schemes with missing descriptions
    schemes_missing_description = Scheme.objects.filter(is_deleted=False).filter(
        Q(description__isnull=True) | Q(description="")
    )

    # Combine all
    all_attention_needed = expired_schemes.union(
        suspended_schemes, schemes_no_items, schemes_missing_description
    )

    return all_attention_needed.distinct()


def scheme_data_integrity_check():
    """
    Run data integrity checks on all schemes.

    Returns:
        dict: Integrity check results
    """
    issues = []

    # Check for schemes without required fields
    schemes_missing_data = Scheme.objects.filter(is_deleted=False).filter(
        Q(scheme_name__isnull=True)
        | Q(scheme_name="")
        | Q(company__isnull=True)
        | Q(card_code__isnull=True)
        | Q(card_code="")
    )

    if schemes_missing_data.exists():
        issues.append(
            {
                "type": "missing_required_data",
                "count": schemes_missing_data.count(),
                "schemes": list(schemes_missing_data.values_list("id", "scheme_name")),
            }
        )

    # Check for duplicate card codes
    duplicate_codes = (
        Scheme.objects.filter(is_deleted=False)
        .values("card_code")
        .annotate(count=Count("id"))
        .filter(count__gt=1)
    )

    if duplicate_codes.exists():
        issues.append(
            {
                "type": "duplicate_card_codes",
                "count": duplicate_codes.count(),
                "codes": list(duplicate_codes.values_list("card_code", flat=True)),
            }
        )

    # Check for schemes with invalid dates
    invalid_date_schemes = Scheme.objects.filter(
        is_deleted=False, start_date__gte=models.F("end_date")
    )

    if invalid_date_schemes.exists():
        issues.append(
            {
                "type": "invalid_dates",
                "count": invalid_date_schemes.count(),
                "schemes": list(invalid_date_schemes.values_list("id", "scheme_name")),
            }
        )

    return {
        "total_issues": len(issues),
        "issues": issues,
        "status": "healthy" if len(issues) == 0 else "needs_attention",
    }
