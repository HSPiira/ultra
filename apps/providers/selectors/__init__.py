"""
Selectors package for providers app.
"""

from .hospital_selector import hospital_list, hospital_get
from .doctor_selector import doctor_list, doctor_get

__all__ = [
    'hospital_list',
    'hospital_get',
    'doctor_list',
    'doctor_get',
]


