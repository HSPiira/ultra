from typing import Optional
from django.db.models import Q

from apps.medical_catalog.models import LabTest


def labtest_list(*, filters: dict | None = None):
    qs = LabTest.objects.all()
    if not filters:
        return qs
    if filters.get('status'):
        qs = qs.filter(status=filters['status'])
    if filters.get('query'):
        q = filters['query']
        qs = qs.filter(Q(name__icontains=q) | Q(category__icontains=q) | Q(units__icontains=q))
    return qs


def labtest_get(*, labtest_id: str) -> Optional[LabTest]:
    return LabTest.objects.filter(pk=labtest_id).first()


