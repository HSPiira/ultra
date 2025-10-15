from django.db import models
from django.core.exceptions import ValidationError
from apps.core.models.base import BaseModel


class Doctor(BaseModel):
    name = models.CharField(max_length=200)
    specialization = models.CharField(max_length=200, blank=True)
    license_number = models.CharField(max_length=100, unique=True, blank=True)
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

    def soft_delete(self, user=None):
        # Prevent deletion if claims exist for this doctor
        from apps.claims.models import Claim
        if Claim.all_objects.filter(doctor_id=self.id, is_deleted=False).exists():
            raise ValidationError("Cannot delete doctor with existing claims.")
        super().soft_delete(user=user)


class DoctorManager(models.Manager):
    def by_license(self, license_number: str):
        return self.filter(license_number=license_number)

    def for_hospital(self, hospital_id: str):
        return self.filter(hospitals__id=hospital_id).distinct()


# Managers
Doctor.objects = DoctorManager()
Doctor.all_objects = models.Manager()


