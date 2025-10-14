from django.db import models
from apps.core.models.base import BaseModel


class Hospital(BaseModel):
    name = models.CharField(max_length=200)
    address = models.TextField(blank=True)
    branch_of = models.ForeignKey(
        'self', null=True, blank=True, related_name='branches', on_delete=models.CASCADE
    )
    contact_person = models.CharField(max_length=100, blank=True)
    phone_number = models.CharField(max_length=50, blank=True)
    email = models.EmailField(blank=True)
    website = models.URLField(blank=True)

    class Meta:
        verbose_name = "Hospital"
        verbose_name_plural = "Hospitals"
        db_table = "hospitals"

    def __str__(self):
        return self.name


