from typing import Optional
from django.db.models import Q

from apps.medical_catalog.models import Medicine


def medicine_list(*, filters: dict | None = None):
    qs = Medicine.objects.all()
    if not filters:
        return qs
    if filters.get('status'):
        qs = qs.filter(status=filters['status'])
    if filters.get('query'):
        q = filters['query']
        qs = qs.filter(Q(name__icontains=q) | Q(dosage_form__icontains=q) | Q(route__icontains=q))
    return qs


def medicine_get(*, medicine_id: str) -> Optional[Medicine]:
    return Medicine.objects.filter(pk=medicine_id).first()


