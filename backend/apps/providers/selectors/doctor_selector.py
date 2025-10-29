
from django.db.models import Q

from apps.providers.models import Doctor


def doctor_list(*, filters: dict | None = None):
    qs = (
        Doctor.objects.prefetch_related("hospitals")
        .prefetch_related("doctorhospitalaffiliation_set__hospital")
        .all()
    )

    if not filters:
        return qs

    if filters.get("status"):
        # Normalize status: convert lowercase to uppercase to match enum values
        status_value = filters["status"].upper() if filters["status"] else None
        if status_value:
            qs = qs.filter(status=status_value)

    # Allow filtering by a single hospital id via either key
    hospital_id = filters.get("hospitals") or filters.get("hospital")
    if hospital_id:
        qs = qs.filter(hospitals__id=hospital_id)

    if filters.get("query"):
        q = filters["query"]
        qs = qs.filter(
            Q(name__icontains=q)
            | Q(specialization__icontains=q)
            | Q(email__icontains=q)
            | Q(phone_number__icontains=q)
            | Q(license_number__icontains=q)
        )

    return qs.distinct()


def doctor_get(*, doctor_id: str) -> Doctor | None:
    return (
        Doctor.objects.prefetch_related("hospitals")
        .prefetch_related("doctorhospitalaffiliation_set__hospital")
        .filter(pk=doctor_id)
        .first()
    )
