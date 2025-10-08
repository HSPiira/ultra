from rest_framework import viewsets
from apps.companies.models import *
from apps.companies.api.serializers import *
from apps.companies.services.company_service import CompanyService
from rest_framework.response import Response
from rest_framework import status
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters

class IndustryViewSet(viewsets.ModelViewSet):
    """
    Handles CRUD operations for Industry (company categories/sectors).
    """
    serializer_class = IndustrySerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status']
    search_fields = ['industry_name', 'description']
    ordering_fields = ['created_at', 'updated_at', 'industry_name']

    def get_queryset(self):
        qs = Industry.objects.filter(is_deleted=False)
        status_param = self.request.query_params.get('status')
        if status_param:
            qs = qs.filter(status=status_param)
        return qs


class CompanyViewSet(viewsets.ModelViewSet):
    """
    Handles CRUD operations for Company entities.
    Uses CompanyService for business logic.
    """
    serializer_class = CompanySerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'industry']
    search_fields = ['company_name', 'contact_person', 'email', 'phone_number']
    ordering_fields = ['created_at', 'updated_at', 'company_name']

    def get_queryset(self):
        query = self.request.query_params.get('search', '').strip()
        filters_dict = {
            'status': self.request.query_params.get('status'),
            'industry': self.request.query_params.get('industry'),
            'query': query,
        }
        return CompanyService.filter_companies(filters_dict)

    def destroy(self, request, *args, **kwargs):
        """
        Override delete → perform soft-delete via the service layer.
        """
        instance = self.get_object()
        CompanyService.deactivate_company(instance.id)
        return Response(status=status.HTTP_204_NO_CONTENT)