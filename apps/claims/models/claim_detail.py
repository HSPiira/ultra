from django.db import models
from django.core.validators import MinValueValidator
from django.core.exceptions import ValidationError

from apps.core.models import FinancialTransaction
from apps.claims.models.claim import Claim


class ClaimDetail(FinancialTransaction):
    claim = models.ForeignKey(Claim, on_delete=models.CASCADE, related_name="details")
    item_description = models.CharField(max_length=500)
    quantity = models.DecimalField(max_digits=10, decimal_places=2, default=1, validators=[MinValueValidator(0)])
    unit_price = models.DecimalField(max_digits=15, decimal_places=2, default=0, validators=[MinValueValidator(0)])
    total_amount = models.DecimalField(max_digits=15, decimal_places=2, default=0, validators=[MinValueValidator(0)])

    class Meta:
        db_table = 'claim_details'

    def __str__(self):
        return f"Detail {self.item_description} x{self.quantity}"

    def clean(self):
        self.total_amount = (self.quantity or 0) * (self.unit_price or 0)
        if self.total_amount < 0:
            raise ValidationError({'total_amount': 'Total amount cannot be negative.'})


