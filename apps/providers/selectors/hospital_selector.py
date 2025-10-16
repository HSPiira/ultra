
from django.db.models import Q

from apps.providers.models import Hospital


def hospital_list(*, filters: dict | None = None):
    qs = Hospital.objects.all()

    if not filters:
        return qs

    if filters.get("status"):
        qs = qs.filter(status=filters["status"])

    if filters.get("query"):
        q = filters["query"]
        qs = qs.filter(
            Q(name__icontains=q)
            | Q(contact_person__icontains=q)
            | Q(email__icontains=q)
            | Q(phone_number__icontains=q)
        )

    if filters.get("branch_of"):
        qs = qs.filter(branch_of_id=filters["branch_of"])

    return qs


def hospital_get(*, hospital_id: str) -> Hospital | None:
    return Hospital.objects.filter(pk=hospital_id).first()
