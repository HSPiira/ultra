from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
from django.core.validators import MinValueValidator
from django.db import models

from apps.core.enums.choices import BusinessStatusChoices
from apps.core.models.base import ActiveManager, BaseModel
from apps.providers.models import Hospital


# ---------------------------------------------------------------------
# HospitalItemPrice
# ---------------------------------------------------------------------
class HospitalItemPrice(BaseModel):
    hospital = models.ForeignKey(Hospital, on_delete=models.CASCADE)
    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE)
    object_id = models.PositiveIntegerField()
    content_object = GenericForeignKey("content_type", "object_id")
    amount = models.DecimalField(
        max_digits=15, decimal_places=2, validators=[MinValueValidator(0)]
    )
    available = models.BooleanField(default=True)

    class Meta:
        db_table = "hospital_item_prices"
        verbose_name = "Hospital Item Price"
        verbose_name_plural = "Hospital Item Prices"
        constraints = [
            models.UniqueConstraint(
                fields=["hospital", "content_type", "object_id"],
                name="uniq_hospital_item_price",
            )
        ]
        indexes = [models.Index(fields=["hospital", "content_type", "object_id"])]


# ---------------------------------------------------------------------
# HospitalItemPriceManager
# ---------------------------------------------------------------------
class HospitalItemPriceManager(ActiveManager):
    def get_price(self, *, hospital_id: str, content_type: ContentType, object_id: int):
        return (
            self.filter(
                hospital_id=hospital_id,
                content_type=content_type,
                object_id=object_id,
                available=True,
                status=BusinessStatusChoices.ACTIVE,
            )
            .values_list("amount", flat=True)
            .first()
        )


# ---------------------------------------------------------------------
# Managers
# ---------------------------------------------------------------------
HospitalItemPrice.objects = HospitalItemPriceManager()
HospitalItemPrice.all_objects = models.Manager()
