from rest_framework.routers import DefaultRouter

from apps.claims.api.views import ClaimViewSet

router = DefaultRouter()
router.register(r"claims", ClaimViewSet, basename="claim")
