from django.core.exceptions import ValidationError
from django.db import models

from apps.core.models.base import BaseModel


class DoctorHospitalAffiliation(BaseModel):
    doctor = models.ForeignKey("providers.Doctor", on_delete=models.CASCADE)
    hospital = models.ForeignKey("providers.Hospital", on_delete=models.CASCADE)
    role = models.CharField(
        max_length=100,
        blank=True,
        help_text="Role at this hospital (e.g., Consultant, Resident)",
    )
    start_date = models.DateField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)
    is_primary = models.BooleanField(
        default=False, help_text="Marks doctor’s main hospital"
    )

    class Meta:
        unique_together = ("doctor", "hospital")

    def __str__(self):
        return f"{self.doctor.name} @ {self.hospital.name}"

    def clean(self):
        errors = {}
        if self.start_date and self.end_date and self.start_date > self.end_date:
            errors["end_date"] = "End date must be on/after start date."

        if self.is_primary:
            qs = type(self).all_objects.filter(doctor=self.doctor, is_primary=True)
            if self.pk:
                qs = qs.exclude(pk=self.pk)
            if qs.exists():
                errors["is_primary"] = (
                    "Only one primary affiliation is allowed per doctor."
                )

        if errors:
            raise ValidationError(errors)
