from rest_framework import viewsets, status, permissions
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters
# JWT authentication removed - using global session authentication

from apps.companies.models import Company, Industry
from apps.companies.api.serializers import CompanySerializer, IndustrySerializer
from apps.companies.services.company_service import CompanyService
from apps.companies.services.industry_service import IndustryService
from apps.companies.selectors import (
    company_list,
    company_get,
    industry_list,
    industry_get,
)

class IndustryViewSet(viewsets.ModelViewSet):
    """
    Handles CRUD operations for Industry (company categories/sectors).
    Uses IndustryService for business logic.
    """
    serializer_class = IndustrySerializer
    # Using global authentication settings from REST_FRAMEWORK

    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status']
    search_fields = ['industry_name', 'description']
    ordering_fields = ['created_at', 'updated_at', 'industry_name']

    def get_queryset(self):
        query = self.request.query_params.get('search', '').strip()
        filters_dict = {
            'status': self.request.query_params.get('status'),
            'query': query,
        }
        return industry_list(filters=filters_dict)

    def create(self, request, *args, **kwargs):
        """Create a new industry using the service layer."""
        industry = IndustryService.industry_create(
            industry_data=request.data, 
            user=request.user
        )
        serializer = self.get_serializer(industry)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def update(self, request, *args, **kwargs):
        """Update an industry using the service layer."""
        industry = IndustryService.industry_update(
            industry_id=kwargs['pk'], 
            update_data=request.data, 
            user=request.user
        )
        serializer = self.get_serializer(industry)
        return Response(serializer.data)

    def destroy(self, request, *args, **kwargs):
        """Override delete → perform soft-delete via the service layer."""
        IndustryService.industry_deactivate(
            industry_id=kwargs['pk'], 
            user=request.user
        )
        return Response(status=status.HTTP_204_NO_CONTENT)



class CompanyViewSet(viewsets.ModelViewSet):
    """
    Handles CRUD operations for Company entities.
    Uses CompanyService for business logic.
    """
    serializer_class = CompanySerializer
    # Using global authentication settings from REST_FRAMEWORK
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
        return company_list(filters=filters_dict)

    def create(self, request, *args, **kwargs):
        """Create a new company using the service layer."""
        company = CompanyService.company_create(
            company_data=request.data, 
            user=request.user
        )
        serializer = self.get_serializer(company)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def update(self, request, *args, **kwargs):
        """Update a company using the service layer."""
        company = CompanyService.company_update(
            company_id=kwargs['pk'], 
            update_data=request.data, 
            user=request.user
        )
        serializer = self.get_serializer(company)
        return Response(serializer.data)

    def destroy(self, request, *args, **kwargs):
        """Override delete → perform soft-delete via the service layer."""
        CompanyService.company_deactivate(
            company_id=kwargs['pk'], 
            user=request.user
        )
        return Response(status=status.HTTP_204_NO_CONTENT)
