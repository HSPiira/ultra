from rest_framework.routers import DefaultRouter

from apps.providers.api.views import DoctorViewSet, HospitalViewSet

router = DefaultRouter()
router.register(r"hospitals", HospitalViewSet, basename="hospital")
router.register(r"doctors", DoctorViewSet, basename="doctor")
