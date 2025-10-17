from django.core.exceptions import ValidationError
from django.db import models

from apps.core.models.base import BaseModel, ActiveManager



class HospitalManager(ActiveManager):
    def by_name(self, name: str):
        return self.filter(name__iexact=name)

    def branches_of(self, parent_id: str):
        return self.filter(branch_of_id=parent_id)


class Hospital(BaseModel):
    name = models.CharField(max_length=200, unique=True)
    address = models.TextField(blank=True)
    branch_of = models.ForeignKey(
        "self", null=True, blank=True, related_name="branches", on_delete=models.CASCADE
    )
    contact_person = models.CharField(max_length=100, blank=True)
    phone_number = models.CharField(max_length=50, blank=True)
    email = models.EmailField(blank=True)
    website = models.URLField(blank=True)

    objects = HospitalManager()      # replaces BaseModel's ActiveManager for this model
    all_objects = models.Manager()

    class Meta:
        verbose_name = "Hospital"
        verbose_name_plural = "Hospitals"
        db_table = "hospitals"

    def __str__(self):
        return self.name

    def soft_delete(self, user=None):
        # Prevent deletion if claims exist for this hospital
        from apps.claims.models import Claim

        if Claim.all_objects.filter(hospital_id=self.id, is_deleted=False).exists():
            raise ValidationError("Cannot delete hospital with existing claims.")
        super().soft_delete(user=user)

