from django.db.models import Q
from apps.members.models import Person


def person_list(*, filters: dict | None = None):
    qs = Person.objects.select_related('company', 'scheme', 'parent')

    if not filters:
        return qs

    if filters.get('company'):
        qs = qs.filter(company_id=filters['company'])
    if filters.get('scheme'):
        qs = qs.filter(scheme_id=filters['scheme'])
    if filters.get('status'):
        qs = qs.filter(status=filters['status'])
    if filters.get('relationship'):
        qs = qs.filter(relationship=filters['relationship'])
    if filters.get('parent'):
        qs = qs.filter(parent_id=filters['parent'])
    if filters.get('query'):
        q = filters['query']
        qs = qs.filter(
            Q(name__icontains=q)
            | Q(card_number__icontains=q)
            | Q(national_id__icontains=q)
            | Q(email__icontains=q)
            | Q(phone_number__icontains=q)
        )

    return qs


def person_get(*, person_id: str):
    try:
        return Person.objects.select_related('company', 'scheme', 'parent').get(id=person_id)
    except Person.DoesNotExist:
        return None

