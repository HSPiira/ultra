from rest_framework.routers import DefaultRouter

from apps.medical_catalog.api.views import (
    ServiceViewSet,
    MedicineViewSet,
    LabTestViewSet,
    HospitalItemPriceViewSet,
)

router = DefaultRouter()
router.register(r'services', ServiceViewSet, basename='service')
router.register(r'medicines', MedicineViewSet, basename='medicine')
router.register(r'lab-tests', LabTestViewSet, basename='labtest')
router.register(r'hospital-item-prices', HospitalItemPriceViewSet, basename='hospitalitemprice')


