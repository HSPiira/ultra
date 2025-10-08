from django.db.models import Q
from apps.companies.models import Company
from apps.core.enums.choices import StatusChoices

class CompanyService:
    """
    Handles company business logic and safe DB access.
    """

    @staticmethod
    def filter_companies(filters: dict):
        """
        Central filtering logic that can be reused by views, cron jobs, etc.
        """
        qs = Company.objects.filter(is_deleted=False)

        if filters.get('status'):
            qs = qs.filter(status=filters['status'])

        if filters.get('industry'):
            qs = qs.filter(industry_id=filters['industry'])

        if filters.get('query'):
            q = filters['query']
            qs = qs.filter(
                Q(company_name__icontains=q) |
                Q(contact_person__icontains=q) |
                Q(email__icontains=q) |
                Q(phone_number__icontains=q)
            )

        return qs

    @staticmethod
    def deactivate_company(company_id: str):
        """Soft delete / deactivate company."""
        company = Company.objects.filter(id=company_id).first()
        if company:
            company.status = StatusChoices.INACTIVE
            company.is_deleted = True
            company.save(update_fields=['status', 'is_deleted'])
        return company
