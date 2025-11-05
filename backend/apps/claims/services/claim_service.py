from typing import Any

from django.core.exceptions import ValidationError
from django.db import transaction

from apps.claims.models import Claim, ClaimDetail, ClaimPayment
from apps.core.enums.choices import BusinessStatusChoices
from apps.core.exceptions.service_errors import NotFoundError, InactiveEntityError, InvalidValueError
from apps.core.services import (
    BaseService,
    CSVExportMixin,
    RequiredFieldsRule,
)


class ClaimService(BaseService, CSVExportMixin):
    """
    Claim business logic for write operations.
    Handles all claim-related write operations including CRUD, validation,
    and business logic. Read operations are handled by selectors.
    
    Uses SOLID improvements:
    - Validation rules for extensible validation (OCP)
    - Standardized method signatures available (ISP)
    Note: Complex business logic (nested details/payments) remains in custom methods,
    but basic validation uses rules.
    """
    
    # BaseService configuration
    entity_model = Claim
    entity_name = "Claim"
    unique_fields = []
    allowed_fields = {
        'member', 'hospital', 'doctor', 'claim_date', 'claim_type',
        'total_amount', 'status', 'notes'
    }
    validation_rules = [
        RequiredFieldsRule(["member", "claim_date", "claim_type"], "Claim"),
    ]
    @staticmethod
    @transaction.atomic
    def create_claim(*, data: dict[str, Any], user=None) -> Claim:
        details: list[dict[str, Any]] = data.pop("details", [])
        payments: list[dict[str, Any]] = data.pop("payments", [])

        # Apply validation rules (configured in BaseService)
        ClaimService._apply_validation_rules(data)

        # Resolve member FK using base method
        if data.get("member"):
            from apps.members.models import Person
            ClaimService._resolve_foreign_key(
                data, "member", Person, "Person", validate_active=True, allow_none=True
            )

        # Resolve hospital FK using base method
        if data.get("hospital"):
            from apps.providers.models import Hospital
            ClaimService._resolve_foreign_key(
                data, "hospital", Hospital, "Hospital", validate_active=True, allow_none=True
            )

        # Resolve doctor FK using base method (if provided)
        if data.get("doctor"):
            from apps.providers.models import Doctor
            ClaimService._resolve_foreign_key(
                data, "doctor", Doctor, "Doctor", validate_active=True
            )

        claim = Claim.objects.create(**data)

        if (
            claim.doctor
            and not claim.doctor.hospitals.filter(pk=claim.hospital_id).exists()
        ):
            raise InvalidValueError("doctor", "Doctor must be affiliated with the selected hospital.")

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
            raise InvalidValueError("doctor", "Doctor must be affiliated with the selected hospital.")

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
