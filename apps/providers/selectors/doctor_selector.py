from typing import Optional
from django.db.models import Q

from apps.providers.models import Doctor


def doctor_list(*, filters: dict | None = None):
    qs = Doctor.objects.select_related('hospital').all()

    if not filters:
        return qs

    if filters.get('status'):
        qs = qs.filter(status=filters['status'])

    if filters.get('hospital'):
        qs = qs.filter(hospital_id=filters['hospital'])

    if filters.get('query'):
        q = filters['query']
        qs = qs.filter(
            Q(name__icontains=q)
            | Q(specialization__icontains=q)
            | Q(email__icontains=q)
            | Q(phone_number__icontains=q)
            | Q(license_number__icontains=q)
        )

    return qs


def doctor_get(*, doctor_id: str) -> Optional[Doctor]:
    return Doctor.objects.select_related('hospital').filter(pk=doctor_id).first()


