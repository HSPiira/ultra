from rest_framework import viewsets, status, permissions
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters

from apps.schemes.models import Benefit
from apps.schemes.api.serializers import BenefitSerializer
from apps.schemes.services.benefit_service import BenefitService
from apps.schemes.selectors import benefit_list


class BenefitViewSet(viewsets.ModelViewSet):
    """
    Handles CRUD operations for Benefit entities.
    Uses BenefitService for business logic.
    """
    serializer_class = BenefitSerializer
    # Using global authentication settings from REST_FRAMEWORK

    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status']
    search_fields = ['benefit_name', 'description']
    ordering_fields = ['created_at', 'updated_at', 'benefit_name']

    def get_queryset(self):
        query = self.request.query_params.get('search', '').strip()
        filters_dict = {
            'status': self.request.query_params.get('status'),
            'query': query,
        }
        return benefit_list(filters=filters_dict)

    def create(self, request, *args, **kwargs):
        """Create a new benefit using the service layer."""
        benefit = BenefitService.benefit_create(
            benefit_data=request.data, 
            user=request.user
        )
        serializer = self.get_serializer(benefit)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def update(self, request, *args, **kwargs):
        """Update a benefit using the service layer."""
        benefit = BenefitService.benefit_update(
            benefit_id=kwargs['pk'], 
            update_data=request.data, 
            user=request.user
        )
        serializer = self.get_serializer(benefit)
        return Response(serializer.data)

    def destroy(self, request, *args, **kwargs):
        """Override delete → perform soft-delete via the service layer."""
        BenefitService.benefit_deactivate(
            benefit_id=kwargs['pk'], 
            user=request.user
        )
        return Response(status=status.HTTP_204_NO_CONTENT)
