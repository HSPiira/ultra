

from apps.medical_catalog.models import HospitalItemPrice


def hospital_item_price_list(*, filters: dict | None = None):
    qs = HospitalItemPrice.objects.select_related("hospital").all()
    if not filters:
        return qs
    if filters.get("status"):
        qs = qs.filter(status=filters["status"])
    if filters.get("hospital"):
        qs = qs.filter(hospital_id=filters["hospital"])
    if filters.get("available") is not None:
        qs = qs.filter(available=filters["available"])
    return qs


def hospital_item_price_get(*, price_id: str) -> HospitalItemPrice | None:
    return (
        HospitalItemPrice.objects.select_related("hospital").filter(pk=price_id).first()
    )
