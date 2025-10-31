from typing import Any

from django.core.exceptions import ValidationError
from django.db import transaction

from apps.core.enums.choices import BusinessStatusChoices
from apps.core.exceptions.service_errors import InactiveEntityError
from apps.providers.models import Doctor, DoctorHospitalAffiliation, Hospital


class DoctorService:
    @staticmethod
    def doctor_create(*, doctor_data: dict[str, Any], user=None) -> Doctor:
        hospital_id = doctor_data.pop("hospital", None)
        hospitals_ids = doctor_data.pop("hospitals", None)
        affiliations_payload: list[dict[str, Any]] | None = doctor_data.pop(
            "affiliations_payload", None
        )

        with transaction.atomic():
            doctor = Doctor.objects.create(**doctor_data)

            # Link hospitals if provided (single or list)
            if hospital_id:
                hospital = Hospital.objects.filter(pk=hospital_id).first()
                if hospital:
                    doctor.hospitals.add(hospital)
            if hospitals_ids:
                doctor.hospitals.add(*Hospital.objects.filter(pk__in=hospitals_ids))

            # Process affiliations payload if provided
            if affiliations_payload:
                DoctorService._replace_affiliations(
                    doctor=doctor, affiliations_payload=affiliations_payload
                )

            return doctor

    @staticmethod
    def doctor_update(
        *, doctor_id: str, update_data: dict[str, Any], user=None
    ) -> Doctor:
        doctor = Doctor.objects.get(pk=doctor_id)

        hospital_id = update_data.pop("hospital", None)
        hospitals_ids = update_data.pop("hospitals", None)
        affiliations_payload: list[dict[str, Any]] | None = update_data.pop(
            "affiliations_payload", None
        )

        with transaction.atomic():
            for field, value in update_data.items():
                setattr(doctor, field, value)
            doctor.save(update_fields=None)

            if hospital_id is not None:
                # If explicitly provided, replace relationships with the single hospital
                hospital = Hospital.objects.filter(pk=hospital_id).first()
                doctor.hospitals.clear()
                if hospital:
                    doctor.hospitals.add(hospital)

            if hospitals_ids is not None:
                doctor.hospitals.set(Hospital.objects.filter(pk__in=hospitals_ids))

            if affiliations_payload is not None:
                DoctorService._replace_affiliations(
                    doctor=doctor, affiliations_payload=affiliations_payload
                )

            return doctor

    @staticmethod
    def _replace_affiliations(
        *, doctor: Doctor, affiliations_payload: list[dict[str, Any]]
    ) -> None:
        # Replace all existing affiliations for simplicity and deterministic updates
        DoctorHospitalAffiliation.objects.filter(doctor=doctor).delete()

        primary_set = False
        for payload in affiliations_payload:
            hospital_id = payload.get("hospital")
            if not hospital_id:
                continue
            hospital = Hospital.objects.filter(pk=hospital_id).first()
            if not hospital:
                continue

            # Validate hospital is active
            if hospital.status != BusinessStatusChoices.ACTIVE or hospital.is_deleted:
                raise InactiveEntityError("Hospital", f"Hospital '{hospital.name}' must be active to create an affiliation")

            # Validate doctor is active
            if doctor.status != BusinessStatusChoices.ACTIVE or doctor.is_deleted:
                raise InactiveEntityError("Doctor", f"Doctor '{doctor.name}' must be active to create an affiliation")

            is_primary = bool(payload.get("is_primary", False))
            # Ensure at most one primary - keep first encountered as primary
            if is_primary and primary_set:
                is_primary = False
            if is_primary:
                primary_set = True

            affiliation = DoctorHospitalAffiliation(
                doctor=doctor,
                hospital=hospital,
                role=payload.get("role", ""),
                start_date=payload.get("start_date"),
                end_date=payload.get("end_date"),
                is_primary=is_primary,
            )
            affiliation.full_clean()  # Run model validation including clean() method
            affiliation.save()

        # Keep M2M in sync with affiliations' hospitals
        hospitals = Hospital.objects.filter(
            pk__in=[
                p.get("hospital") for p in affiliations_payload if p.get("hospital")
            ]
        )
        if hospitals.exists():
            doctor.hospitals.set(hospitals)

    @staticmethod
    def doctor_deactivate(*, doctor_id: str, user=None) -> None:
        doctor = Doctor.objects.get(pk=doctor_id)
        doctor.soft_delete(user=user)
        doctor.save(update_fields=["is_deleted", "deleted_at", "deleted_by"])
