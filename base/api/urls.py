"""
URL Configuration for Ultra Core API
Defines all API endpoints and routing
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from base.views import *

router = DefaultRouter()
router.register(r'industries', IndustryViewSet, basename='industry')
router.register(r'companies', CompanyViewSet, basename='company')
router.register(r'schemes', SchemeViewSet, basename='scheme')

urlpatterns = [
    path('api/', include(router.urls)),
]

urlpatterns += router.urls