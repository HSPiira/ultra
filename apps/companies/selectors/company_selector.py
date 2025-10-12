from django.db.models import Q, Count
from django.utils import timezone
from datetime import timedelta
from typing import Dict, List, Optional, Any
from apps.companies.models import Company
from apps.core.enums.choices import BusinessStatusChoices
from apps.schemes.models import Scheme


# ---------------------------------------------------------------------
# Company Selectors
# ---------------------------------------------------------------------

def company_list(*, filters: dict = None):
    """
    Get filtered list of companies.
    
    Args:
        filters: Dictionary containing filter criteria
        
    Returns:
        QuerySet: Filtered company queryset
    """
    qs = Company.objects.select_related('industry').filter(is_deleted=False)
    
    if not filters:
        return qs
    
    if filters.get('status'):
        qs = qs.filter(status=filters['status'])
    
    if filters.get('industry'):
        qs = qs.filter(industry_id=filters['industry'])
    
    if filters.get('query'):
        q = filters['query']
        qs = qs.filter(
            Q(company_name__icontains=q) |
            Q(contact_person__icontains=q) |
            Q(email__icontains=q) |
            Q(phone_number__icontains=q)
        )
    
    return qs


def company_search_advanced(*, search_params: dict):
    """
    Advanced search with multiple criteria.
    
    Args:
        search_params: Dictionary containing advanced search criteria
        
    Returns:
        QuerySet: Filtered company queryset
    """
    qs = Company.objects.select_related('industry').filter(is_deleted=False)
    
    # Industry filter
    if search_params.get('industry_ids'):
        qs = qs.filter(industry_id__in=search_params['industry_ids'])
    
    # Status filter
    if search_params.get('statuses'):
        qs = qs.filter(status__in=search_params['statuses'])
    
    # Date range filters
    if search_params.get('created_after'):
        qs = qs.filter(created_at__gte=search_params['created_after'])
    if search_params.get('created_before'):
        qs = qs.filter(created_at__lte=search_params['created_before'])
    
    # Has schemes filter
    if search_params.get('has_schemes') is not None:
        if search_params['has_schemes']:
            qs = qs.filter(schemes__isnull=False).distinct()
        else:
            qs = qs.filter(schemes__isnull=True)
    
    # Text search across multiple fields
    if search_params.get('search_text'):
        search_text = search_params['search_text']
        qs = qs.filter(
            Q(company_name__icontains=search_text) |
            Q(contact_person__icontains=search_text) |
            Q(email__icontains=search_text) |
            Q(phone_number__icontains=search_text) |
            Q(company_address__icontains=search_text) |
            Q(remark__icontains=search_text)
        )
    
    return qs


def company_get(*, company_id: str):
    """
    Get a single company by ID.
    
    Args:
        company_id: ID of the company
        
    Returns:
        Company: Company instance or None
    """
    try:
        return Company.objects.select_related('industry').get(
            id=company_id, 
            is_deleted=False
        )
    except Company.DoesNotExist:
        return None


def company_schemes_list(*, company_id: str):
    """
    Get all schemes associated with a company.
    
    Args:
        company_id: ID of the company
        
    Returns:
        QuerySet: Schemes associated with the company
    """
    return Scheme.objects.filter(company_id=company_id, is_deleted=False)


def company_list_by_industry(*, industry_id: str):
    """
    Get all companies in a specific industry.
    
    Args:
        industry_id: ID of the industry
        
    Returns:
        QuerySet: Companies in the specified industry
    """
    return Company.objects.select_related('industry').filter(
        industry_id=industry_id, 
        is_deleted=False
    )


def company_contact_info_get(*, company_id: str):
    """
    Get formatted contact information for a company.
    
    Args:
        company_id: ID of the company
        
    Returns:
        dict: Formatted contact information or None
    """
    company = company_get(company_id=company_id)
    if not company:
        return None
    
    return {
        'company_name': company.company_name,
        'contact_person': company.contact_person,
        'email': company.email,
        'phone_number': company.phone_number,
        'website': company.website,
        'address': company.company_address
    }


def company_statistics_get():
    """
    Get comprehensive company statistics.
    
    Returns:
        dict: Company statistics
    """
    stats = Company.objects.filter(is_deleted=False).aggregate(
        total_companies=Count('id'),
        active_companies=Count('id', filter=Q(status=BusinessStatusChoices.ACTIVE)),
        inactive_companies=Count('id', filter=Q(status=BusinessStatusChoices.INACTIVE)),
        suspended_companies=Count('id', filter=Q(status=BusinessStatusChoices.SUSPENDED))
    )
    
    # Add industry breakdown
    industry_stats = Company.objects.filter(is_deleted=False).values(
        'industry__industry_name'
    ).annotate(
        count=Count('id')
    ).order_by('-count')
    
    stats['by_industry'] = list(industry_stats)
    
    return stats


def company_list_with_recent_activity(*, days: int = 30):
    """
    Get companies with recent scheme activity.
    
    Args:
        days: Number of days to look back for activity
        
    Returns:
        QuerySet: Companies with recent activity
    """
    cutoff_date = timezone.now() - timedelta(days=days)
    
    return Company.objects.select_related('industry').filter(
        is_deleted=False,
        schemes__created_at__gte=cutoff_date
    ).distinct()


def company_health_score_get(*, company_id: str):
    """
    Calculate company health score based on various factors.
    
    Args:
        company_id: ID of the company
        
    Returns:
        dict: Health score and factors or None
    """
    company = company_get(company_id=company_id)
    if not company:
        return None
    
    score = 0
    factors = {}
    
    # Status factor (40 points)
    if company.status == BusinessStatusChoices.ACTIVE:
        score += 40
        factors['status'] = 'Active'
    elif company.status == BusinessStatusChoices.SUSPENDED:
        score += 20
        factors['status'] = 'Suspended'
    else:
        score += 0
        factors['status'] = 'Inactive'
    
    # Scheme activity factor (30 points)
    scheme_count = company_schemes_list(company_id=company_id).count()
    if scheme_count > 0:
        score += min(30, scheme_count * 10)
        factors['schemes'] = f'{scheme_count} active schemes'
    else:
        factors['schemes'] = 'No active schemes'
    
    # Contact completeness factor (20 points)
    contact_score = 0
    if company.email:
        contact_score += 5
    if company.phone_number:
        contact_score += 5
    if company.website:
        contact_score += 5
    if company.company_address:
        contact_score += 5
    
    score += contact_score
    factors['contact_completeness'] = f'{contact_score}/20'
    
    # Recent activity factor (10 points)
    recent_activity = company_list_with_recent_activity(days=30).filter(id=company_id).exists()
    if recent_activity:
        score += 10
        factors['recent_activity'] = 'Active in last 30 days'
    else:
        factors['recent_activity'] = 'No recent activity'
    
    return {
        'score': min(100, score),
        'factors': factors,
        'grade': 'A' if score >= 80 else 'B' if score >= 60 else 'C' if score >= 40 else 'D'
    }


def company_health_scores_list():
    """
    Get health scores for all companies.
    
    Returns:
        list: List of health score data
    """
    companies = company_list()
    health_data = []
    
    for company in companies:
        health_score = company_health_score_get(company_id=company.id)
        if health_score:
            health_data.append({
                'company_id': company.id,
                'company_name': company.company_name,
                'health_score': health_score
            })
    
    return health_data


def company_list_needing_attention():
    """
    Get companies that need attention (inactive schemes, missing data, etc.).
    
    Returns:
        QuerySet: Companies needing attention
    """
    # Companies with no active schemes
    companies_no_schemes = Company.objects.filter(
        is_deleted=False,
        schemes__isnull=True
    )
    
    # Companies with suspended status
    companies_suspended = Company.objects.filter(
        is_deleted=False,
        status=BusinessStatusChoices.SUSPENDED
    )
    
    # Companies with missing contact information
    companies_missing_contact = Company.objects.filter(
        is_deleted=False
    ).filter(
        Q(email__isnull=True) | Q(email='') |
        Q(phone_number__isnull=True) | Q(phone_number='')
    )
    
    # Combine all
    all_attention_needed = companies_no_schemes.union(
        companies_suspended,
        companies_missing_contact
    )
    
    return all_attention_needed.distinct()


def company_data_integrity_check():
    """
    Run data integrity checks on all companies.
    
    Returns:
        dict: Integrity check results
    """
    issues = []
    
    # Check for companies without required fields
    companies_missing_data = Company.objects.filter(
        is_deleted=False
    ).filter(
        Q(company_name__isnull=True) | Q(company_name='') |
        Q(contact_person__isnull=True) | Q(contact_person='') |
        Q(email__isnull=True) | Q(email='') |
        Q(phone_number__isnull=True) | Q(phone_number='')
    )
    
    if companies_missing_data.exists():
        issues.append({
            'type': 'missing_required_data',
            'count': companies_missing_data.count(),
            'companies': list(companies_missing_data.values_list('id', 'company_name'))
        })
    
    # Check for duplicate emails
    duplicate_emails = Company.objects.filter(
        is_deleted=False
    ).values('email').annotate(
        count=Count('id')
    ).filter(count__gt=1)
    
    if duplicate_emails.exists():
        issues.append({
            'type': 'duplicate_emails',
            'count': duplicate_emails.count(),
            'emails': list(duplicate_emails.values_list('email', flat=True))
        })
    
    return {
        'total_issues': len(issues),
        'issues': issues,
        'status': 'healthy' if len(issues) == 0 else 'needs_attention'
    }
