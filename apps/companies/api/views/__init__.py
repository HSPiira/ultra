"""
Views package for companies app API.
Organized into logical modules for better maintainability.
"""

from .core_views import IndustryViewSet, CompanyViewSet
from .industry_analytics import IndustryAnalyticsViewSet
from .company_analytics import CompanyAnalyticsViewSet

__all__ = [
    'IndustryViewSet',
    'CompanyViewSet', 
    'IndustryAnalyticsViewSet',
    'CompanyAnalyticsViewSet',
]
