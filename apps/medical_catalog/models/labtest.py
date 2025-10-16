from django.core.validators import MinValueValidator
from django.db import models

from apps.core.models.base import BaseModel


class LabTestManager(models.Manager):
    def by_name(self, name: str):
        return self.filter(name__iexact=name)

    def by_category(self, category: str):
        return self.filter(category__iexact=category)
    

class LabTest(BaseModel):
    name = models.CharField(max_length=200, unique=True)
    category = models.CharField(max_length=100, blank=True)
    description = models.TextField(blank=True)
    base_amount = models.DecimalField(
        max_digits=15, decimal_places=2, validators=[MinValueValidator(0)]
    )
    normal_range = models.CharField(max_length=200, blank=True)
    units = models.CharField(max_length=50, blank=True)

    objects = LabTestManager()
    all_objects = models.Manager()

    class Meta:
        verbose_name = "Lab Test"
        verbose_name_plural = "Lab Tests"
        db_table = "lab_tests"

    def __str__(self):
        return self.name

