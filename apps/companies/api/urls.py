"""
URL Configuration for company app API
Defines all API endpoints and routing
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from apps.companies.api.views import *

router = DefaultRouter()
router.register(r'industries', IndustryViewSet, basename='industry')
router.register(r'companies', CompanyViewSet, basename='company')

urlpatterns = [
    path('api/', include(router.urls)),
]

urlpatterns += router.urls