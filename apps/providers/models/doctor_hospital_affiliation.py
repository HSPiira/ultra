from django.db import models
from apps.core.models.base import BaseModel


class DoctorHospitalAffiliation(BaseModel):
    doctor = models.ForeignKey("providers.Doctor", on_delete=models.CASCADE)
    hospital = models.ForeignKey("providers.Hospital", on_delete=models.CASCADE)
    role = models.CharField(max_length=100, blank=True, help_text="Role at this hospital (e.g., Consultant, Resident)")
    start_date = models.DateField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)
    is_primary = models.BooleanField(default=False, help_text="Marks doctor’s main hospital")

    class Meta:
        unique_together = ("doctor", "hospital")

    def __str__(self):
        return f"{self.doctor.name} @ {self.hospital.name}"


