from django.db import models
from apps.core.models.base import BaseModel
from apps.providers.models.hospital import Hospital


class Doctor(BaseModel):
    hospital = models.ForeignKey(Hospital, on_delete=models.CASCADE, related_name="doctors")
    name = models.CharField(max_length=200)
    specialization = models.CharField(max_length=200, blank=True)
    license_number = models.CharField(max_length=100, blank=True)
    qualification = models.CharField(max_length=500, blank=True)
    phone_number = models.CharField(max_length=50, blank=True)
    email = models.EmailField(blank=True)

    class Meta:
        verbose_name = "Doctor"
        verbose_name_plural = "Doctors"
        db_table = "doctors"

    def __str__(self):
        return self.name


