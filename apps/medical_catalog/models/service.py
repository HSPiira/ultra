from django.core.validators import MinValueValidator
from django.db import models

from apps.core.models.base import BaseModel, ActiveManager


class ServiceManager(ActiveManager):
    def by_name(self, name: str):
        return self.filter(name__iexact=name)

    def by_category(self, category: str):
        return self.filter(category__iexact=category)
    

class Service(BaseModel):
    name = models.CharField(max_length=200, unique=True)
    category = models.CharField(max_length=100, blank=True)
    description = models.TextField(blank=True)
    base_amount = models.DecimalField(
        max_digits=15, decimal_places=2, validators=[MinValueValidator(0)]
    )
    service_type = models.CharField(max_length=50)

    objects = ServiceManager()
    all_objects = models.Manager()

    class Meta:
        verbose_name = "Service"
        verbose_name_plural = "Services"
        db_table = "services"

    def __str__(self):
        return self.name
