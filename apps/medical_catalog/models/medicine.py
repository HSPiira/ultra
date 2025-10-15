from django.db import models
from django.core.validators import MinValueValidator
from apps.core.models.base import BaseModel


class Medicine(BaseModel):
    name = models.CharField(max_length=200)
    dosage_form = models.CharField(max_length=100)
    unit_price = models.DecimalField(max_digits=15, decimal_places=2, validators=[MinValueValidator(0)])
    route = models.CharField(max_length=100)
    duration = models.CharField(max_length=100, blank=True)

    class Meta:
        verbose_name = "Medicine"
        verbose_name_plural = "Medicines"
        db_table = 'medicines'
        unique_together = ("name", "dosage_form")

    def __str__(self):
        return self.name


class MedicineManager(models.Manager):
    def by_name(self, name: str):
        return self.filter(name__iexact=name)

    def by_form(self, dosage_form: str):
        return self.filter(dosage_form__iexact=dosage_form)


# Managers
Medicine.objects = MedicineManager()
Medicine.all_objects = models.Manager()


