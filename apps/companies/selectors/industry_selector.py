from datetime import timedelta

from django.db.models import Count, Q
from django.utils import timezone

from apps.companies.models import Company, Industry
from apps.core.enums.choices import BusinessStatusChoices

# ---------------------------------------------------------------------
# Industry Selectors
# ---------------------------------------------------------------------


def industry_list(*, filters: dict = None):
    """
    Get filtered list of industries.

    Args:
        filters: Dictionary containing filter criteria

    Returns:
        QuerySet: Filtered industry queryset
    """
    qs = Industry.objects.filter(is_deleted=False)

    if not filters:
        return qs

    if filters.get("status"):
        qs = qs.filter(status=filters["status"])

    if filters.get("query"):
        q = filters["query"]
        qs = qs.filter(Q(industry_name__icontains=q) | Q(description__icontains=q))

    return qs


def industry_get(*, industry_id: str):
    """
    Get a single industry by ID.

    Args:
        industry_id: ID of the industry

    Returns:
        Industry: Industry instance or None
    """
    try:
        return Industry.objects.get(id=industry_id, is_deleted=False)
    except Industry.DoesNotExist:
        return None


def industry_companies_list(*, industry_id: str):
    """
    Get all companies associated with an industry.

    Args:
        industry_id: ID of the industry

    Returns:
        QuerySet: Companies associated with the industry
    """
    return Company.objects.select_related("industry").filter(
        industry_id=industry_id, is_deleted=False
    )


def industry_statistics_get():
    """
    Get comprehensive industry statistics.

    Returns:
        dict: Industry statistics
    """
    stats = Industry.objects.filter(is_deleted=False).aggregate(
        total_industries=Count("id"),
        active_industries=Count("id", filter=Q(status=BusinessStatusChoices.ACTIVE)),
        inactive_industries=Count(
            "id", filter=Q(status=BusinessStatusChoices.INACTIVE)
        ),
        suspended_industries=Count(
            "id", filter=Q(status=BusinessStatusChoices.SUSPENDED)
        ),
    )

    # Add company distribution
    industry_company_stats = (
        Industry.objects.filter(is_deleted=False)
        .annotate(
            company_count=Count("companies", filter=Q(companies__is_deleted=False))
        )
        .values("id", "industry_name", "company_count")
        .order_by("-company_count")
    )

    stats["by_company_count"] = list(industry_company_stats)

    # Add top industries by company count
    top_industries = (
        Industry.objects.filter(is_deleted=False)
        .annotate(
            company_count=Count("companies", filter=Q(companies__is_deleted=False))
        )
        .order_by("-company_count")[:5]
    )

    stats["top_industries"] = [
        {
            "id": industry.id,
            "name": industry.industry_name,
            "company_count": industry.company_count,
        }
        for industry in top_industries
    ]

    return stats


def industry_health_score_get(*, industry_id: str):
    """
    Calculate industry health score based on various factors.

    Args:
        industry_id: ID of the industry

    Returns:
        dict: Health score and factors or None
    """
    industry = industry_get(industry_id=industry_id)
    if not industry:
        return None

    score = 0
    factors = {}

    # Status factor (40 points)
    if industry.status == BusinessStatusChoices.ACTIVE:
        score += 40
        factors["status"] = "Active"
    elif industry.status == BusinessStatusChoices.SUSPENDED:
        score += 20
        factors["status"] = "Suspended"
    else:
        score += 0
        factors["status"] = "Inactive"

    # Company activity factor (30 points)
    company_count = industry_companies_list(industry_id=industry_id).count()
    if company_count > 0:
        score += min(30, company_count * 5)  # 5 points per company, max 30
        factors["companies"] = f"{company_count} companies"
    else:
        factors["companies"] = "No companies"

    # Description completeness factor (20 points)
    if industry.description and len(industry.description.strip()) > 10:
        score += 20
        factors["description"] = "Complete description"
    elif industry.description:
        score += 10
        factors["description"] = "Partial description"
    else:
        factors["description"] = "No description"

    # Recent activity factor (10 points)
    cutoff_date = timezone.now() - timedelta(days=30)

    recent_companies = Company.objects.filter(
        industry=industry, is_deleted=False, created_at__gte=cutoff_date
    ).count()

    if recent_companies > 0:
        score += 10
        factors["recent_activity"] = f"{recent_companies} new companies in last 30 days"
    else:
        factors["recent_activity"] = "No recent activity"

    return {
        "score": min(100, score),
        "factors": factors,
        "grade": (
            "A" if score >= 80 else "B" if score >= 60 else "C" if score >= 40 else "D"
        ),
    }


def industry_health_scores_list():
    """
    Get health scores for all industries.

    Returns:
        list: List of health score data
    """
    industries = industry_list()
    health_data = []

    for industry in industries:
        health_score = industry_health_score_get(industry_id=industry.id)
        if health_score:
            health_data.append(
                {
                    "industry_id": industry.id,
                    "industry_name": industry.industry_name,
                    "health_score": health_score,
                }
            )

    return health_data


def industry_list_with_most_companies(*, limit: int = 10):
    """
    Get industries with the most companies.

    Args:
        limit: Number of industries to return

    Returns:
        QuerySet: Industries ordered by company count
    """
    return (
        Industry.objects.filter(is_deleted=False)
        .annotate(
            company_count=Count("companies", filter=Q(companies__is_deleted=False))
        )
        .order_by("-company_count")[:limit]
    )


def industry_list_without_companies():
    """
    Get industries that have no associated companies.

    Returns:
        QuerySet: Industries without companies
    """
    return Industry.objects.filter(is_deleted=False, companies__isnull=True)


def industry_list_needing_attention():
    """
    Get industries that need attention (no companies, suspended, etc.).

    Returns:
        QuerySet: Industries needing attention
    """
    # Industries with no companies
    industries_no_companies = Industry.objects.filter(
        is_deleted=False, companies__isnull=True
    )

    # Industries with suspended status
    industries_suspended = Industry.objects.filter(
        is_deleted=False, status=BusinessStatusChoices.SUSPENDED
    )

    # Industries with missing descriptions
    industries_missing_description = Industry.objects.filter(is_deleted=False).filter(
        Q(description__isnull=True) | Q(description="")
    )

    # Combine all
    all_attention_needed = industries_no_companies.union(
        industries_suspended, industries_missing_description
    )

    return all_attention_needed.distinct()


def industry_choices_get():
    """
    Get industry choices for forms/dropdowns.

    Returns:
        list: List of (id, name) tuples
    """
    return list(
        Industry.objects.filter(is_deleted=False, status=BusinessStatusChoices.ACTIVE)
        .values_list("id", "industry_name")
        .order_by("industry_name")
    )


def industry_data_integrity_check():
    """
    Run data integrity checks on all industries.

    Returns:
        dict: Integrity check results
    """
    issues = []

    # Check for industries without required fields
    industries_missing_data = Industry.objects.filter(is_deleted=False).filter(
        Q(industry_name__isnull=True) | Q(industry_name="")
    )

    if industries_missing_data.exists():
        issues.append(
            {
                "type": "missing_required_data",
                "count": industries_missing_data.count(),
                "industries": list(
                    industries_missing_data.values_list("id", "industry_name")
                ),
            }
        )

    # Check for duplicate names
    duplicate_names = (
        Industry.objects.filter(is_deleted=False)
        .values("industry_name")
        .annotate(count=Count("id"))
        .filter(count__gt=1)
    )

    if duplicate_names.exists():
        issues.append(
            {
                "type": "duplicate_names",
                "count": duplicate_names.count(),
                "names": list(duplicate_names.values_list("industry_name", flat=True)),
            }
        )

    # Check for industries with no companies
    industries_no_companies = industry_list_without_companies()
    if industries_no_companies.exists():
        issues.append(
            {
                "type": "industries_without_companies",
                "count": industries_no_companies.count(),
                "industries": list(
                    industries_no_companies.values_list("id", "industry_name")
                ),
            }
        )

    return {
        "total_issues": len(issues),
        "issues": issues,
        "status": "healthy" if len(issues) == 0 else "needs_attention",
    }
