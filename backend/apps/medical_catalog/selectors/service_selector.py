
from django.db.models import Q

from apps.medical_catalog.models import Service


def service_list(*, filters: dict | None = None):
    qs = Service.objects.all()
    if not filters:
        return qs
    if filters.get("status"):
        qs = qs.filter(status=filters["status"])
    if filters.get("query"):
        q = filters["query"]
        qs = qs.filter(
            Q(name__icontains=q)
            | Q(category__icontains=q)
            | Q(service_type__icontains=q)
        )
    return qs


def service_get(*, service_id: str) -> Service | None:
    return Service.objects.filter(pk=service_id).first()
