
from django.db.models import Count, Q

from apps.core.enums.choices import BusinessStatusChoices
from apps.schemes.models import Benefit

# ---------------------------------------------------------------------
# Benefit Selectors
# ---------------------------------------------------------------------


def benefit_list(*, filters: dict = None):
    """
    Get filtered list of benefits.

    Args:
        filters: Dictionary containing filter criteria

    Returns:
        QuerySet: Filtered benefit queryset
    """
    qs = Benefit.objects.filter(is_deleted=False)

    if not filters:
        return qs

    if filters.get("status"):
        qs = qs.filter(status=filters["status"])

    if filters.get("in_or_out_patient"):
        qs = qs.filter(in_or_out_patient=filters["in_or_out_patient"])

    if filters.get("query"):
        q = filters["query"]
        qs = qs.filter(Q(benefit_name__icontains=q) | Q(description__icontains=q))

    return qs


def benefit_get(*, benefit_id: str):
    """
    Get a single benefit by ID.

    Args:
        benefit_id: ID of the benefit

    Returns:
        Benefit: Benefit instance or None
    """
    try:
        return Benefit.objects.get(id=benefit_id, is_deleted=False)
    except Benefit.DoesNotExist:
        return None


def benefit_statistics_get():
    """
    Get comprehensive benefit statistics.

    Returns:
        dict: Benefit statistics
    """
    stats = Benefit.objects.filter(is_deleted=False).aggregate(
        total_benefits=Count("id"),
        active_benefits=Count("id", filter=Q(status=BusinessStatusChoices.ACTIVE)),
        inactive_benefits=Count("id", filter=Q(status=BusinessStatusChoices.INACTIVE)),
        suspended_benefits=Count(
            "id", filter=Q(status=BusinessStatusChoices.SUSPENDED)
        ),
    )

    # Add patient type breakdown
    patient_type_stats = (
        Benefit.objects.filter(is_deleted=False)
        .values("in_or_out_patient")
        .annotate(count=Count("id"))
        .order_by("-count")
    )

    stats["by_patient_type"] = list(patient_type_stats)

    return stats


def benefit_health_score_get(*, benefit_id: str):
    """
    Calculate benefit health score based on various factors.

    Args:
        benefit_id: ID of the benefit

    Returns:
        dict: Health score and factors or None
    """
    benefit = benefit_get(benefit_id=benefit_id)
    if not benefit:
        return None

    score = 0
    factors = {}

    # Status factor (40 points)
    if benefit.status == BusinessStatusChoices.ACTIVE:
        score += 40
        factors["status"] = "Active"
    elif benefit.status == BusinessStatusChoices.SUSPENDED:
        score += 20
        factors["status"] = "Suspended"
    else:
        score += 0
        factors["status"] = "Inactive"

    # Usage factor (30 points)
    usage_count = benefit.schemeitem_set.filter(is_deleted=False).count()
    if usage_count > 0:
        score += min(30, usage_count * 10)  # 10 points per usage, max 30
        factors["usage"] = f"{usage_count} scheme items"
    else:
        factors["usage"] = "Not used in any schemes"

    # Description completeness factor (20 points)
    if benefit.description and len(benefit.description.strip()) > 10:
        score += 20
        factors["description"] = "Complete description"
    elif benefit.description:
        score += 10
        factors["description"] = "Partial description"
    else:
        factors["description"] = "No description"

    # Limit amount factor (10 points)
    if benefit.limit_amount and benefit.limit_amount > 0:
        score += 10
        factors["limit_amount"] = f"Limit: {benefit.limit_amount}"
    else:
        factors["limit_amount"] = "No limit amount"

    return {
        "score": min(100, score),
        "factors": factors,
        "grade": (
            "A" if score >= 80 else "B" if score >= 60 else "C" if score >= 40 else "D"
        ),
    }


def benefit_health_scores_list():
    """
    Get health scores for all benefits.

    Returns:
        list: List of health score data
    """
    benefits = benefit_list()
    health_data = []

    for benefit in benefits:
        health_score = benefit_health_score_get(benefit_id=benefit.id)
        if health_score:
            health_data.append(
                {
                    "benefit_id": benefit.id,
                    "benefit_name": benefit.benefit_name,
                    "health_score": health_score,
                }
            )

    return health_data


def benefit_list_needing_attention():
    """
    Get benefits that need attention (unused, suspended, etc.).

    Returns:
        QuerySet: Benefits needing attention
    """
    # Benefits with suspended status
    suspended_benefits = Benefit.objects.filter(
        is_deleted=False, status=BusinessStatusChoices.SUSPENDED
    )

    # Benefits with no usage
    unused_benefits = Benefit.objects.filter(is_deleted=False, schemeitem__isnull=True)

    # Benefits with missing descriptions
    benefits_missing_description = Benefit.objects.filter(is_deleted=False).filter(
        Q(description__isnull=True) | Q(description="")
    )

    # Benefits with no limit amount
    benefits_no_limit = Benefit.objects.filter(
        is_deleted=False, limit_amount__isnull=True
    )

    # Combine all
    all_attention_needed = suspended_benefits.union(
        unused_benefits, benefits_missing_description, benefits_no_limit
    )

    return all_attention_needed.distinct()


def benefit_data_integrity_check():
    """
    Run data integrity checks on all benefits.

    Returns:
        dict: Integrity check results
    """
    issues = []

    # Check for benefits without required fields
    benefits_missing_data = Benefit.objects.filter(is_deleted=False).filter(
        Q(benefit_name__isnull=True)
        | Q(benefit_name="")
        | Q(in_or_out_patient__isnull=True)
        | Q(in_or_out_patient="")
    )

    if benefits_missing_data.exists():
        issues.append(
            {
                "type": "missing_required_data",
                "count": benefits_missing_data.count(),
                "benefits": list(
                    benefits_missing_data.values_list("id", "benefit_name")
                ),
            }
        )

    # Check for duplicate names with same patient type
    duplicate_combinations = (
        Benefit.objects.filter(is_deleted=False)
        .values("benefit_name", "in_or_out_patient")
        .annotate(count=Count("id"))
        .filter(count__gt=1)
    )

    if duplicate_combinations.exists():
        issues.append(
            {
                "type": "duplicate_combinations",
                "count": duplicate_combinations.count(),
                "combinations": list(
                    duplicate_combinations.values_list(
                        "benefit_name", "in_or_out_patient"
                    )
                ),
            }
        )

    # Check for benefits with negative limit amounts
    negative_limits = Benefit.objects.filter(is_deleted=False, limit_amount__lt=0)

    if negative_limits.exists():
        issues.append(
            {
                "type": "negative_limit_amounts",
                "count": negative_limits.count(),
                "benefits": list(negative_limits.values_list("id", "benefit_name")),
            }
        )

    return {
        "total_issues": len(issues),
        "issues": issues,
        "status": "healthy" if len(issues) == 0 else "needs_attention",
    }
