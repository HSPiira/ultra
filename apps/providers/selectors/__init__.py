"""
Selectors package for providers app.
"""

from .doctor_selector import doctor_get, doctor_list
from .hospital_selector import hospital_get, hospital_list

__all__ = [
    "hospital_list",
    "hospital_get",
    "doctor_list",
    "doctor_get",
]
