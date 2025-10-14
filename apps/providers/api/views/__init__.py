"""
Views package for providers app API.
"""

from .hospital_views import HospitalViewSet
from .doctor_views import DoctorViewSet

__all__ = [
    'HospitalViewSet',
    'DoctorViewSet',
]


