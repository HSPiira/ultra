"""
Views package for providers app API.
"""

from .doctor_views import DoctorViewSet
from .hospital_views import HospitalViewSet

__all__ = [
    "HospitalViewSet",
    "DoctorViewSet",
]
