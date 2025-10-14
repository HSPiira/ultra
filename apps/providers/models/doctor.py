from django.db import models
from apps.core.models.base import BaseModel


class Doctor(BaseModel):
    name = models.CharField(max_length=200)
    specialization = models.CharField(max_length=200, blank=True)
    license_number = models.CharField(max_length=100, blank=True)
    qualification = models.CharField(max_length=500, blank=True)
    phone_number = models.CharField(max_length=50, blank=True)
    email = models.EmailField(blank=True)
    hospitals = models.ManyToManyField(
        "providers.Hospital",
        through="DoctorHospitalAffiliation",
        related_name="doctors",
    )

    class Meta:
        verbose_name = "Doctor"
        verbose_name_plural = "Doctors"
        db_table = "doctors"

    def __str__(self):
        return self.name


