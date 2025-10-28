"""
Views package for companies app API.
Organized into logical modules for better maintainability.
"""

from .company_analytics import CompanyAnalyticsViewSet
from .core_views import CompanyViewSet, IndustryViewSet
from .industry_analytics import IndustryAnalyticsViewSet

__all__ = [
    "IndustryViewSet",
    "CompanyViewSet",
    "IndustryAnalyticsViewSet",
    "CompanyAnalyticsViewSet",
]
