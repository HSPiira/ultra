"""
URL Configuration for company app API
Defines all API endpoints and routing
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from apps.companies.api.views import (
    IndustryViewSet,
    CompanyViewSet,
    IndustryAnalyticsViewSet,
    CompanyAnalyticsViewSet
)

router = DefaultRouter()

# Core CRUD endpoints
router.register(r'industries', IndustryViewSet, basename='industry')
router.register(r'companies', CompanyViewSet, basename='company')

# Analytics and advanced operations endpoints
router.register(r'industries-analytics', IndustryAnalyticsViewSet, basename='industry-analytics')
router.register(r'companies-analytics', CompanyAnalyticsViewSet, basename='company-analytics')

urlpatterns = router.urls