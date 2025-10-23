from .hospital_item_price_views import HospitalItemPriceViewSet
from .labtest_views import LabTestViewSet
from .medicine_views import MedicineViewSet
from .service_views import ServiceViewSet
from .statistics_views import MedicalCatalogStatisticsViewSet

__all__ = [
    "ServiceViewSet",
    "MedicineViewSet",
    "LabTestViewSet",
    "HospitalItemPriceViewSet",
    "MedicalCatalogStatisticsViewSet",
]
