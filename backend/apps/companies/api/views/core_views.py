from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.core.utils.caching import CacheableResponseMixin
# JWT authentication removed - using global session authentication
from apps.companies.api.serializers import CompanySerializer, IndustrySerializer
from apps.companies.selectors import (
    company_list,
    industry_list,
)
from apps.companies.services.company_service import CompanyService
from apps.companies.services.industry_service import IndustryService


class IndustryViewSet(CacheableResponseMixin, viewsets.ModelViewSet):
    """
    Handles CRUD operations for Industry (company categories/sectors).
    Uses IndustryService for business logic.
    """

    serializer_class = IndustrySerializer
    # Using global authentication settings from REST_FRAMEWORK
    
    # Industries don't change frequently, so cache longer
    cache_list_timeout = 900  # 15 minutes (instead of default 5 minutes)
    cache_detail_timeout = 1800  # 30 minutes (instead of default 10 minutes)

    filter_backends = [
        DjangoFilterBackend,
        filters.SearchFilter,
        filters.OrderingFilter,
    ]
    filterset_fields = ["status"]
    search_fields = ["industry_name", "description"]
    ordering_fields = ["created_at", "updated_at", "industry_name"]

    def get_queryset(self):
        query = self.request.query_params.get("search", "").strip()
        filters_dict = {
            "status": self.request.query_params.get("status"),
            "query": query,
        }
        return industry_list(filters=filters_dict)

    def create(self, request, *args, **kwargs):
        """Create a new industry using the service layer."""
        user_id = request.user.id if request.user.is_authenticated else None
        industry = IndustryService.industry_create(
            industry_data=request.data, user=request.user
        )
        serializer = self.get_serializer(industry)
        response = Response(serializer.data, status=status.HTTP_201_CREATED)
        # Invalidate cache after successful create
        self.invalidate_cache(user_id=user_id)
        return response

    def update(self, request, *args, **kwargs):
        """Update an industry using the service layer."""
        user_id = request.user.id if request.user.is_authenticated else None
        industry = IndustryService.industry_update(
            industry_id=kwargs["pk"], update_data=request.data, user=request.user
        )
        serializer = self.get_serializer(industry)
        response = Response(serializer.data)
        # Invalidate cache after successful update
        self.invalidate_cache(user_id=user_id)
        return response

    def destroy(self, request, *args, **kwargs):
        """Override delete → perform soft-delete via the service layer."""
        user_id = request.user.id if request.user.is_authenticated else None
        IndustryService.industry_deactivate(industry_id=kwargs["pk"], user=request.user)
        response = Response(status=status.HTTP_204_NO_CONTENT)
        # Invalidate cache after successful delete
        self.invalidate_cache(user_id=user_id)
        return response


class CompanyViewSet(CacheableResponseMixin, viewsets.ModelViewSet):
    """
    Handles CRUD operations for Company entities.
    Uses CompanyService for business logic.
    """

    serializer_class = CompanySerializer
    # Using global authentication settings from REST_FRAMEWORK
    filter_backends = [
        DjangoFilterBackend,
        filters.SearchFilter,
        filters.OrderingFilter,
    ]
    filterset_fields = ["status", "industry"]
    search_fields = ["company_name", "contact_person", "email", "phone_number"]
    ordering_fields = ["created_at", "updated_at", "company_name"]

    def get_queryset(self):
        query = self.request.query_params.get("search", "").strip()
        filters_dict = {
            "status": self.request.query_params.get("status"),
            "industry": self.request.query_params.get("industry"),
            "query": query,
        }
        return company_list(filters=filters_dict)

    def create(self, request, *args, **kwargs):
        """Create a new company using the service layer."""
        user_id = request.user.id if request.user.is_authenticated else None
        company = CompanyService.company_create(
            company_data=request.data, user=request.user
        )
        serializer = self.get_serializer(company)
        response = Response(serializer.data, status=status.HTTP_201_CREATED)
        # Invalidate cache after successful create
        self.invalidate_cache(user_id=user_id)
        return response

    def update(self, request, *args, **kwargs):
        """Update a company using the service layer."""
        user_id = request.user.id if request.user.is_authenticated else None
        company = CompanyService.company_update(
            company_id=kwargs["pk"], update_data=request.data, user=request.user
        )
        serializer = self.get_serializer(company)
        response = Response(serializer.data)
        # Invalidate cache after successful update
        self.invalidate_cache(user_id=user_id)
        return response

    def destroy(self, request, *args, **kwargs):
        """Override delete → perform soft-delete via the service layer."""
        user_id = request.user.id if request.user.is_authenticated else None
        CompanyService.company_soft_delete(company_id=kwargs["pk"], user=request.user)
        response = Response(status=status.HTTP_204_NO_CONTENT)
        # Invalidate cache after successful delete
        self.invalidate_cache(user_id=user_id)
        return response

    @action(detail=True, methods=['post'])
    def activate(self, request, pk=None):
        """Activate a company."""
        user_id = request.user.id if request.user.is_authenticated else None
        company = CompanyService.company_activate(company_id=pk, user=request.user)
        serializer = self.get_serializer(company)
        response = Response(serializer.data)
        # Invalidate cache after status change
        self.invalidate_cache(user_id=user_id)
        return response

    @action(detail=True, methods=['post'])
    def deactivate(self, request, pk=None):
        """Deactivate a company."""
        user_id = request.user.id if request.user.is_authenticated else None
        company = CompanyService.company_deactivate(company_id=pk, user=request.user)
        serializer = self.get_serializer(company)
        response = Response(serializer.data)
        # Invalidate cache after status change
        self.invalidate_cache(user_id=user_id)
        return response

    @action(detail=True, methods=['post'])
    def suspend(self, request, pk=None):
        """Suspend a company with reason."""
        user_id = request.user.id if request.user.is_authenticated else None
        reason = request.data.get('reason', '')
        if not reason:
            return Response(
                {'error': 'Reason is required for suspension'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        company = CompanyService.company_suspend(company_id=pk, reason=reason, user=request.user)
        serializer = self.get_serializer(company)
        response = Response(serializer.data)
        # Invalidate cache after status change
        self.invalidate_cache(user_id=user_id)
        return response
