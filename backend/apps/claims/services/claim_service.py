from typing import Any

from django.core.exceptions import ValidationError
from django.db import transaction

from apps.claims.models import Claim, ClaimDetail, ClaimPayment


class ClaimService:
    @staticmethod
    @transaction.atomic
    def create_claim(*, data: dict[str, Any], user=None) -> Claim:
        details: list[dict[str, Any]] = data.pop("details", [])
        payments: list[dict[str, Any]] = data.pop("payments", [])

        claim = Claim.objects.create(**data)

        if (
            claim.doctor
            and not claim.doctor.hospitals.filter(pk=claim.hospital_id).exists()
        ):
            raise ValidationError(
                {"doctor": "Doctor must be affiliated with the selected hospital."}
            )

        for d in details:
            ClaimDetail.objects.create(claim=claim, **d)

        for p in payments:
            ClaimPayment.objects.create(claim=claim, **p)

        return claim

    @staticmethod
    @transaction.atomic
    def update_claim(*, claim_id: str, data: dict[str, Any], user=None) -> Claim:
        details: list[dict[str, Any]] | None = data.pop("details", None)
        payments: list[dict[str, Any]] | None = data.pop("payments", None)

        claim = Claim.objects.select_for_update().get(pk=claim_id)

        for field, value in data.items():
            setattr(claim, field, value)
        claim.full_clean()
        claim.save(update_fields=None)

        if (
            claim.doctor
            and not claim.doctor.hospitals.filter(pk=claim.hospital_id).exists()
        ):
            raise ValidationError(
                {"doctor": "Doctor must be affiliated with the selected hospital."}
            )

        if details is not None:
            claim.details.all().delete()
            for d in details:
                ClaimDetail.objects.create(claim=claim, **d)

        if payments is not None:
            claim.payments.all().delete()
            for p in payments:
                ClaimPayment.objects.create(claim=claim, **p)

        return claim

    @staticmethod
    def delete_claim(*, claim_id: str, user=None) -> None:
        claim = Claim.objects.get(pk=claim_id)
        claim.soft_delete(user=user)
        claim.save(update_fields=["is_deleted", "deleted_at", "deleted_by"])
