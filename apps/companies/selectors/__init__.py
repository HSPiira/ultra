"""
Selectors package for companies app.
Organized by domain for better maintainability.
"""

from .company_selector import *
from .industry_selector import *

__all__ = [
    # Company selectors
    'company_list',
    'company_get',
    'company_search_advanced',
    'company_schemes_list',
    'company_list_by_industry',
    'company_contact_info_get',
    'company_statistics_get',
    'company_list_with_recent_activity',
    'company_health_score_get',
    'company_health_scores_list',
    'company_list_needing_attention',
    'company_data_integrity_check',
    
    # Industry selectors
    'industry_list',
    'industry_get',
    'industry_companies_list',
    'industry_statistics_get',
    'industry_health_score_get',
    'industry_health_scores_list',
    'industry_list_with_most_companies',
    'industry_list_without_companies',
    'industry_list_needing_attention',
    'industry_choices_get',
    'industry_data_integrity_check',
]
