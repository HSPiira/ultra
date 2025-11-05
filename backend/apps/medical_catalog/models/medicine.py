from django.core.exceptions import ValidationError
from django.core.validators import MinValueValidator
from django.db import models

from apps.core.models.base import BaseModel, ActiveManager


class MedicineManager(ActiveManager):
    def by_name(self, name: str):
        return self.filter(name__iexact=name)

    def by_form(self, dosage_form: str):
        return self.filter(dosage_form__iexact=dosage_form)


class Medicine(BaseModel):
    name = models.CharField(max_length=200)
    dosage_form = models.CharField(max_length=100)
    unit_price = models.DecimalField(
        max_digits=15, decimal_places=2, validators=[MinValueValidator(0)]
    )
    route = models.CharField(max_length=100)
    duration = models.CharField(max_length=100, blank=True)

    objects = MedicineManager()
    all_objects = models.Manager()

    class Meta:
        verbose_name = "Medicine"
        verbose_name_plural = "Medicines"
        db_table = "medicines"
        unique_together = ("name", "dosage_form")

    def __str__(self):
        return self.name

    def soft_delete(self, user=None):
        """Prevent deletion when medicine is referenced in hospital item prices or scheme items."""
        from apps.medical_catalog.models import HospitalItemPrice
        from apps.schemes.models.scheme_item import SchemeItem
        from django.contrib.contenttypes.models import ContentType

        # Check for hospital item prices
        content_type = ContentType.objects.get_for_model(Medicine)
        if HospitalItemPrice.all_objects.filter(
            content_type=content_type, object_id=self.id, is_deleted=False
        ).exists():
            raise ValidationError(
                "Cannot delete medicine with existing hospital item prices. Remove prices first."
            )

        # Check for scheme items
        if SchemeItem.all_objects.filter(
            content_type=content_type, object_id=self.id, is_deleted=False
        ).exists():
            raise ValidationError(
                "Cannot delete medicine with existing scheme items. Remove scheme items first."
            )

        super().soft_delete(user=user)
