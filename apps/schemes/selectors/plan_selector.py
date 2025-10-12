from django.db.models import Q, Count
from typing import Dict, List, Optional, Any
from apps.schemes.models import Plan
from apps.core.enums.choices import BusinessStatusChoices


# ---------------------------------------------------------------------
# Plan Selectors
# ---------------------------------------------------------------------

def plan_list(*, filters: dict = None):
    """
    Get filtered list of plans.
    
    Args:
        filters: Dictionary containing filter criteria
        
    Returns:
        QuerySet: Filtered plan queryset
    """
    qs = Plan.objects.filter(is_deleted=False)
    
    if not filters:
        return qs
    
    if filters.get('status'):
        qs = qs.filter(status=filters['status'])
    
    if filters.get('query'):
        q = filters['query']
        qs = qs.filter(
            Q(plan_name__icontains=q) |
            Q(description__icontains=q)
        )
    
    return qs


def plan_get(*, plan_id: str):
    """
    Get a single plan by ID.
    
    Args:
        plan_id: ID of the plan
        
    Returns:
        Plan: Plan instance or None
    """
    try:
        return Plan.objects.get(id=plan_id, is_deleted=False)
    except Plan.DoesNotExist:
        return None


def plan_statistics_get():
    """
    Get comprehensive plan statistics.
    
    Returns:
        dict: Plan statistics
    """
    stats = Plan.objects.filter(is_deleted=False).aggregate(
        total_plans=Count('id'),
        active_plans=Count('id', filter=Q(status=BusinessStatusChoices.ACTIVE)),
        inactive_plans=Count('id', filter=Q(status=BusinessStatusChoices.INACTIVE)),
        suspended_plans=Count('id', filter=Q(status=BusinessStatusChoices.SUSPENDED))
    )
    
    return stats


def plan_health_score_get(*, plan_id: str):
    """
    Calculate plan health score based on various factors.
    
    Args:
        plan_id: ID of the plan
        
    Returns:
        dict: Health score and factors or None
    """
    plan = plan_get(plan_id=plan_id)
    if not plan:
        return None
    
    score = 0
    factors = {}
    
    # Status factor (40 points)
    if plan.status == BusinessStatusChoices.ACTIVE:
        score += 40
        factors['status'] = 'Active'
    elif plan.status == BusinessStatusChoices.SUSPENDED:
        score += 20
        factors['status'] = 'Suspended'
    else:
        score += 0
        factors['status'] = 'Inactive'
    
    # Usage factor (30 points)
    usage_count = plan.schemeitem_set.filter(is_deleted=False).count()
    if usage_count > 0:
        score += min(30, usage_count * 10)  # 10 points per usage, max 30
        factors['usage'] = f'{usage_count} scheme items'
    else:
        factors['usage'] = 'Not used in any schemes'
    
    # Description completeness factor (30 points)
    if plan.description and len(plan.description.strip()) > 10:
        score += 30
        factors['description'] = 'Complete description'
    elif plan.description:
        score += 15
        factors['description'] = 'Partial description'
    else:
        factors['description'] = 'No description'
    
    return {
        'score': min(100, score),
        'factors': factors,
        'grade': 'A' if score >= 80 else 'B' if score >= 60 else 'C' if score >= 40 else 'D'
    }


def plan_health_scores_list():
    """
    Get health scores for all plans.
    
    Returns:
        list: List of health score data
    """
    plans = plan_list()
    health_data = []
    
    for plan in plans:
        health_score = plan_health_score_get(plan_id=plan.id)
        if health_score:
            health_data.append({
                'plan_id': plan.id,
                'plan_name': plan.plan_name,
                'health_score': health_score
            })
    
    return health_data


def plan_list_needing_attention():
    """
    Get plans that need attention (unused, suspended, etc.).
    
    Returns:
        QuerySet: Plans needing attention
    """
    # Plans with suspended status
    suspended_plans = Plan.objects.filter(
        is_deleted=False,
        status=BusinessStatusChoices.SUSPENDED
    )
    
    # Plans with no usage
    unused_plans = Plan.objects.filter(
        is_deleted=False,
        schemeitem__isnull=True
    )
    
    # Plans with missing descriptions
    plans_missing_description = Plan.objects.filter(
        is_deleted=False
    ).filter(
        Q(description__isnull=True) | Q(description='')
    )
    
    # Combine all
    all_attention_needed = suspended_plans.union(
        unused_plans,
        plans_missing_description
    )
    
    return all_attention_needed.distinct()


def plan_data_integrity_check():
    """
    Run data integrity checks on all plans.
    
    Returns:
        dict: Integrity check results
    """
    issues = []
    
    # Check for plans without required fields
    plans_missing_data = Plan.objects.filter(
        is_deleted=False
    ).filter(
        Q(plan_name__isnull=True) | Q(plan_name='')
    )
    
    if plans_missing_data.exists():
        issues.append({
            'type': 'missing_required_data',
            'count': plans_missing_data.count(),
            'plans': list(plans_missing_data.values_list('id', 'plan_name'))
        })
    
    # Check for duplicate names
    duplicate_names = Plan.objects.filter(
        is_deleted=False
    ).values('plan_name').annotate(
        count=Count('id')
    ).filter(count__gt=1)
    
    if duplicate_names.exists():
        issues.append({
            'type': 'duplicate_names',
            'count': duplicate_names.count(),
            'names': list(duplicate_names.values_list('plan_name', flat=True))
        })
    
    return {
        'total_issues': len(issues),
        'issues': issues,
        'status': 'healthy' if len(issues) == 0 else 'needs_attention'
    }
