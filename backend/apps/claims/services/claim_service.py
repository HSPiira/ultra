from typing import Any

from django.core.exceptions import ValidationError
from django.db import transaction

from apps.claims.models import Claim, ClaimDetail, ClaimPayment
from apps.core.enums.choices import BusinessStatusChoices


class ClaimService:
    @staticmethod
    @transaction.atomic
    def create_claim(*, data: dict[str, Any], user=None) -> Claim:
        details: list[dict[str, Any]] = data.pop("details", [])
        payments: list[dict[str, Any]] = data.pop("payments", [])

        # Validate member is active
        member_id = data.get("member")
        if member_id:
            from apps.members.models import Person
            if isinstance(member_id, str):
                try:
                    member = Person.objects.get(id=member_id)
                    data["member"] = member
                except Person.DoesNotExist:
                    raise ValidationError("Invalid member ID")
            else:
                member = member_id
            
            if member.status != BusinessStatusChoices.ACTIVE or member.is_deleted:
                raise ValidationError("Member must be active to create a claim")

        # Validate hospital is active
        hospital_id = data.get("hospital")
        if hospital_id:
            from apps.providers.models import Hospital
            if isinstance(hospital_id, str):
                try:
                    hospital = Hospital.objects.get(id=hospital_id)
                    data["hospital"] = hospital
                except Hospital.DoesNotExist:
                    raise ValidationError("Invalid hospital ID")
            else:
                hospital = hospital_id
            
            if hospital.status != BusinessStatusChoices.ACTIVE or hospital.is_deleted:
                raise ValidationError("Hospital must be active to create a claim")

        # Validate doctor is active (if provided)
        doctor_id = data.get("doctor")
        if doctor_id:
            from apps.providers.models import Doctor
            if isinstance(doctor_id, str):
                try:
                    doctor = Doctor.objects.get(id=doctor_id)
                    data["doctor"] = doctor
                except Doctor.DoesNotExist:
                    raise ValidationError("Invalid doctor ID")
            else:
                doctor = doctor_id
            
            if doctor.status != BusinessStatusChoices.ACTIVE or doctor.is_deleted:
                raise ValidationError("Doctor must be active to create a claim")

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
