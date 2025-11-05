from django.core.exceptions import ValidationError
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

    def soft_delete(self, user=None):
        """Prevent deletion when service is referenced in hospital item prices or scheme items."""
        from apps.medical_catalog.models import HospitalItemPrice
        from apps.schemes.models.scheme_item import SchemeItem
        from django.contrib.contenttypes.models import ContentType

        # Check for hospital item prices
        content_type = ContentType.objects.get_for_model(Service)
        if HospitalItemPrice.all_objects.filter(
            content_type=content_type, object_id=self.id, is_deleted=False
        ).exists():
            raise ValidationError(
                "Cannot delete service with existing hospital item prices. Remove prices first."
            )

        # Check for scheme items
        if SchemeItem.all_objects.filter(
            content_type=content_type, object_id=self.id, is_deleted=False
        ).exists():
            raise ValidationError(
                "Cannot delete service with existing scheme items. Remove scheme items first."
            )

        super().soft_delete(user=user)
