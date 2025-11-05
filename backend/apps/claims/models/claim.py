from django.core.exceptions import ValidationError
from django.db import models

from apps.core.enums.choices import ClaimStatusChoices
from apps.core.models import FinancialTransaction
from apps.members.models import Person
from apps.providers.models import Doctor, Hospital


class Claim(FinancialTransaction):
    member = models.ForeignKey(Person, on_delete=models.PROTECT, related_name="claims")
    hospital = models.ForeignKey(Hospital, on_delete=models.PROTECT)
    doctor = models.ForeignKey(Doctor, null=True, blank=True, on_delete=models.SET_NULL)
    service_date = models.DateField()
    claim_status = models.CharField(
        max_length=20,
        choices=ClaimStatusChoices.choices,
        default=ClaimStatusChoices.PENDING,
        help_text="Current status of the claim",
    )
    invoice_number = models.CharField(max_length=100, blank=True)

    class Meta:
        db_table = "claims"
        indexes = [
            models.Index(fields=["member", "service_date"]),
            models.Index(fields=["hospital", "service_date"]),
        ]

    def __str__(self):
        return f"Claim {self.id} - {self.member} @ {self.hospital}"

    def clean(self):
        errors = {}
        if (
            self.doctor
            and not self.doctor.hospitals.filter(pk=self.hospital_id).exists()
        ):
            errors["doctor"] = "Doctor must be affiliated with the selected hospital."
        if errors:
            raise ValidationError(errors)
