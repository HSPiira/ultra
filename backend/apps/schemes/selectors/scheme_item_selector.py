
from django.db.models import Count, Q

from apps.core.enums.choices import BusinessStatusChoices
from apps.schemes.models import SchemeItem

# ---------------------------------------------------------------------
# Scheme Item Selectors
# ---------------------------------------------------------------------


def scheme_item_list(*, filters: dict = None):
    """
    Get filtered list of scheme items.

    Args:
        filters: Dictionary containing filter criteria

    Returns:
        QuerySet: Filtered scheme item queryset
    """
    qs = SchemeItem.objects.select_related("scheme", "content_type").filter(
        is_deleted=False
    )

    if not filters:
        return qs

    if filters.get("status"):
        qs = qs.filter(status=filters["status"])

    if filters.get("scheme"):
        qs = qs.filter(scheme_id=filters["scheme"])

    if filters.get("content_type"):
        qs = qs.filter(content_type=filters["content_type"])

    if filters.get("query"):
        q = filters["query"]
        qs = qs.filter(
            Q(scheme__scheme_name__icontains=q)
            | Q(item__plan_name__icontains=q)
            | Q(item__benefit_name__icontains=q)
        )

    return qs


def scheme_item_get(*, scheme_item_id: str):
    """
    Get a single scheme item by ID.

    Args:
        scheme_item_id: ID of the scheme item

    Returns:
        SchemeItem: Scheme item instance or None
    """
    try:
        return SchemeItem.objects.select_related("scheme", "content_type").get(
            id=scheme_item_id, is_deleted=False
        )
    except SchemeItem.DoesNotExist:
        return None


def scheme_item_list_by_scheme(*, scheme_id: str):
    """
    Get all scheme items for a specific scheme.

    Args:
        scheme_id: ID of the scheme

    Returns:
        QuerySet: Scheme items for the specified scheme
    """
    return SchemeItem.objects.select_related("scheme", "content_type").filter(
        scheme_id=scheme_id, is_deleted=False
    )


def scheme_item_list_by_content_type(*, content_type_id: str):
    """
    Get all scheme items for a specific content type.

    Args:
        content_type_id: ID of the content type

    Returns:
        QuerySet: Scheme items for the specified content type
    """
    return SchemeItem.objects.select_related("scheme", "content_type").filter(
        content_type_id=content_type_id, is_deleted=False
    )


def scheme_item_statistics_get():
    """
    Get comprehensive scheme item statistics.

    Returns:
        dict: Scheme item statistics
    """
    stats = SchemeItem.objects.filter(is_deleted=False).aggregate(
        total_scheme_items=Count("id"),
        active_scheme_items=Count("id", filter=Q(status=BusinessStatusChoices.ACTIVE)),
        inactive_scheme_items=Count(
            "id", filter=Q(status=BusinessStatusChoices.INACTIVE)
        ),
        suspended_scheme_items=Count(
            "id", filter=Q(status=BusinessStatusChoices.SUSPENDED)
        ),
    )

    # Add content type breakdown
    content_type_stats = (
        SchemeItem.objects.filter(is_deleted=False)
        .values("content_type__model")
        .annotate(count=Count("id"))
        .order_by("-count")
    )

    stats["by_content_type"] = list(content_type_stats)

    # Add scheme breakdown
    scheme_stats = (
        SchemeItem.objects.filter(is_deleted=False)
        .values("scheme__scheme_name")
        .annotate(count=Count("id"))
        .order_by("-count")
    )

    stats["by_scheme"] = list(scheme_stats)

    return stats


def scheme_item_health_score_get(*, scheme_item_id: str):
    """
    Calculate scheme item health score based on various factors.

    Args:
        scheme_item_id: ID of the scheme item

    Returns:
        dict: Health score and factors or None
    """
    scheme_item = scheme_item_get(scheme_item_id=scheme_item_id)
    if not scheme_item:
        return None

    score = 0
    factors = {}

    # Status factor (40 points)
    if scheme_item.status == BusinessStatusChoices.ACTIVE:
        score += 40
        factors["status"] = "Active"
    elif scheme_item.status == BusinessStatusChoices.SUSPENDED:
        score += 20
        factors["status"] = "Suspended"
    else:
        score += 0
        factors["status"] = "Inactive"

    # Scheme status factor (30 points)
    if scheme_item.scheme.status == BusinessStatusChoices.ACTIVE:
        score += 30
        factors["scheme_status"] = "Active scheme"
    elif scheme_item.scheme.status == BusinessStatusChoices.SUSPENDED:
        score += 15
        factors["scheme_status"] = "Suspended scheme"
    else:
        score += 0
        factors["scheme_status"] = "Inactive scheme"

    # Limit amount factor (20 points)
    if scheme_item.limit_amount and scheme_item.limit_amount > 0:
        score += 20
        factors["limit_amount"] = f"Limit: {scheme_item.limit_amount}"
    else:
        factors["limit_amount"] = "No limit amount"

    # Copayment factor (10 points)
    if scheme_item.copayment_percent is not None:
        score += 10
        factors["copayment"] = f"Copayment: {scheme_item.copayment_percent}%"
    else:
        factors["copayment"] = "No copayment"

    return {
        "score": min(100, score),
        "factors": factors,
        "grade": (
            "A" if score >= 80 else "B" if score >= 60 else "C" if score >= 40 else "D"
        ),
    }


def scheme_item_health_scores_list():
    """
    Get health scores for all scheme items.

    Returns:
        list: List of health score data
    """
    scheme_items = scheme_item_list()
    health_data = []

    for scheme_item in scheme_items:
        health_score = scheme_item_health_score_get(scheme_item_id=scheme_item.id)
        if health_score:
            health_data.append(
                {
                    "scheme_item_id": scheme_item.id,
                    "scheme_name": scheme_item.scheme.scheme_name,
                    "item_name": str(scheme_item.item),
                    "health_score": health_score,
                }
            )

    return health_data


def scheme_item_list_needing_attention():
    """
    Get scheme items that need attention (inactive schemes, missing data, etc.).

    Returns:
        QuerySet: Scheme items needing attention
    """
    # Scheme items with suspended status
    suspended_items = SchemeItem.objects.filter(
        is_deleted=False, status=BusinessStatusChoices.SUSPENDED
    )

    # Scheme items with inactive schemes
    inactive_scheme_items = SchemeItem.objects.filter(
        is_deleted=False, scheme__status=BusinessStatusChoices.INACTIVE
    )

    # Scheme items with no limit amount and no copayment
    items_no_limits = SchemeItem.objects.filter(
        is_deleted=False, limit_amount__isnull=True, copayment_percent__isnull=True
    )

    # Combine all
    all_attention_needed = suspended_items.union(inactive_scheme_items, items_no_limits)

    return all_attention_needed.distinct()


def scheme_item_data_integrity_check():
    """
    Run data integrity checks on all scheme items.

    Returns:
        dict: Integrity check results
    """
    issues = []

    # Check for scheme items without required fields
    items_missing_data = SchemeItem.objects.filter(is_deleted=False).filter(
        Q(scheme__isnull=True)
        | Q(content_type__isnull=True)
        | Q(object_id__isnull=True)
        | Q(object_id="")
    )

    if items_missing_data.exists():
        issues.append(
            {
                "type": "missing_required_data",
                "count": items_missing_data.count(),
                "items": list(
                    items_missing_data.values_list("id", "scheme__scheme_name")
                ),
            }
        )

    # Check for duplicate scheme items
    duplicate_items = (
        SchemeItem.objects.filter(is_deleted=False)
        .values("scheme", "content_type", "object_id")
        .annotate(count=Count("id"))
        .filter(count__gt=1)
    )

    if duplicate_items.exists():
        issues.append(
            {
                "type": "duplicate_items",
                "count": duplicate_items.count(),
                "items": list(
                    duplicate_items.values_list("scheme", "content_type", "object_id")
                ),
            }
        )

    # Check for scheme items with invalid copayment percentages
    invalid_copayment = SchemeItem.objects.filter(is_deleted=False).filter(
        Q(copayment_percent__lt=0) | Q(copayment_percent__gt=100)
    )

    if invalid_copayment.exists():
        issues.append(
            {
                "type": "invalid_copayment",
                "count": invalid_copayment.count(),
                "items": list(
                    invalid_copayment.values_list("id", "scheme__scheme_name")
                ),
            }
        )

    # Check for scheme items with negative limit amounts
    negative_limits = SchemeItem.objects.filter(is_deleted=False, limit_amount__lt=0)

    if negative_limits.exists():
        issues.append(
            {
                "type": "negative_limit_amounts",
                "count": negative_limits.count(),
                "items": list(negative_limits.values_list("id", "scheme__scheme_name")),
            }
        )

    return {
        "total_issues": len(issues),
        "issues": issues,
        "status": "healthy" if len(issues) == 0 else "needs_attention",
    }


def scheme_available_items_get(*, scheme_id: str, content_type: str):
    """
    Get available items for assignment to a scheme (items not already assigned).

    Args:
        scheme_id: ID of the scheme
        content_type: Content type to filter by (hospital, service, labtest, medicine, plan, benefit)

    Returns:
        QuerySet: Available items for assignment
    """
    from django.contrib.contenttypes.models import ContentType
    from apps.providers.models import Hospital
    from apps.medical_catalog.models import Service, LabTest, Medicine
    from apps.schemes.models import Plan, Benefit

    # Get content type
    if content_type == "hospital":
        ct = ContentType.objects.get_for_model(Hospital)
        model_class = Hospital
    elif content_type == "service":
        ct = ContentType.objects.get_for_model(Service)
        model_class = Service
    elif content_type == "labtest":
        ct = ContentType.objects.get_for_model(LabTest)
        model_class = LabTest
    elif content_type == "medicine":
        ct = ContentType.objects.get_for_model(Medicine)
        model_class = Medicine
    elif content_type == "plan":
        ct = ContentType.objects.get_for_model(Plan)
        model_class = Plan
    elif content_type == "benefit":
        ct = ContentType.objects.get_for_model(Benefit)
        model_class = Benefit
    else:
        raise ValueError(f"Invalid content type: {content_type}")

    # Get already assigned items for this scheme
    assigned_object_ids = SchemeItem.objects.filter(
        scheme_id=scheme_id,
        content_type=ct,
        is_deleted=False
    ).values_list("object_id", flat=True)

    # Get available items (not assigned)
    available_items = model_class.objects.filter(
        is_deleted=False
    ).exclude(id__in=assigned_object_ids)

    return available_items


def scheme_assigned_items_get(*, scheme_id: str, content_type: str = None):
    """
    Get assigned items for a scheme, optionally filtered by content type.

    Args:
        scheme_id: ID of the scheme
        content_type: Optional content type to filter by

    Returns:
        QuerySet: Assigned scheme items
    """
    qs = SchemeItem.objects.select_related("scheme", "content_type").filter(
        scheme_id=scheme_id, is_deleted=False
    )

    if content_type:
        from django.contrib.contenttypes.models import ContentType
        ct = ContentType.objects.get_for_model(content_type)
        qs = qs.filter(content_type=ct)

    return qs
