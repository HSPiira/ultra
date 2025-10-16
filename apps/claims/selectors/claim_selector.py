
from django.db.models import Q

from apps.claims.models import Claim


def claim_list(*, filters: dict | None = None):
    qs = Claim.objects.select_related("member", "hospital", "doctor").prefetch_related(
        "details", "payments"
    )

    if not filters:
        return qs

    if filters.get("member"):
        qs = qs.filter(member_id=filters["member"])

    if filters.get("hospital"):
        qs = qs.filter(hospital_id=filters["hospital"])

    if filters.get("doctor"):
        qs = qs.filter(doctor_id=filters["doctor"])

    if filters.get("status"):
        qs = qs.filter(claim_status=filters["status"])

    if filters.get("date_from"):
        qs = qs.filter(service_date__gte=filters["date_from"])

    if filters.get("date_to"):
        qs = qs.filter(service_date__lte=filters["date_to"])

    if q := filters.get("query"):
        qs = qs.filter(Q(invoice_number__icontains=q))

    return qs


def claim_get(*, claim_id: str) -> Claim | None:
    return (
        Claim.objects.select_related("member", "hospital", "doctor")
        .prefetch_related("details", "payments")
        .filter(pk=claim_id)
        .first()
    )
