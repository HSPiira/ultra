from django.db import models

from apps.claims.models.claim import Claim
from apps.core.models import FinancialTransaction


class ClaimPayment(FinancialTransaction):
    claim = models.ForeignKey(Claim, on_delete=models.CASCADE, related_name="payments")
    method = models.CharField(max_length=50)
    reference = models.CharField(max_length=100, blank=True)

    class Meta:
        db_table = "claim_payments"

    def __str__(self):
        return f"Payment {self.method} for Claim {self.claim_id}"
