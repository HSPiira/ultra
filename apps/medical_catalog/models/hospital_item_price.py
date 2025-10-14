from django.db import models
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType

from apps.core.models.base import BaseModel
from apps.providers.models import Hospital


class HospitalItemPrice(BaseModel):
    hospital = models.ForeignKey(Hospital, on_delete=models.CASCADE)
    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE)
    object_id = models.PositiveIntegerField()
    content_object = GenericForeignKey('content_type', 'object_id')
    amount = models.DecimalField(max_digits=15, decimal_places=2)
    available = models.BooleanField(default=True)

    class Meta:
        db_table = 'hospital_item_prices'


