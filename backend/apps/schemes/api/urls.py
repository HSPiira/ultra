"""
URL Configuration for scheme app API
Defines all API endpoints and routing
"""

from rest_framework.routers import DefaultRouter

from apps.schemes.api.views import (
    BenefitViewSet,
    PlanViewSet,
    SchemeItemViewSet,
    SchemeViewSet,
)

router = DefaultRouter()
router.register(r"schemes", SchemeViewSet, basename="scheme")
router.register(r"plans", PlanViewSet, basename="plan")
router.register(r"benefits", BenefitViewSet, basename="benefit")
router.register(r"scheme-items", SchemeItemViewSet, basename="schemeitem")

urlpatterns = router.urls
