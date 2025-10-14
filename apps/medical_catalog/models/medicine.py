from django.db import models
from apps.core.models.base import BaseModel


class Medicine(BaseModel):
    name = models.CharField(max_length=200)
    dosage_form = models.CharField(max_length=100)
    unit_price = models.DecimalField(max_digits=15, decimal_places=2)
    route = models.CharField(max_length=100)
    duration = models.CharField(max_length=100, blank=True)

    class Meta:
        verbose_name = "Medicine"
        verbose_name_plural = "Medicines"
        db_table = 'medicines'

    def __str__(self):
        return self.name


