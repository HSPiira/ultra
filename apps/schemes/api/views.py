from rest_framework import viewsets, status, permissions
from rest_framework.response import Response
from rest_framework_simplejwt.authentication import JWTAuthentication

from apps.schemes.models import Scheme, Plan, Benefit, SchemeItem
from apps.schemes.api.serializers import SchemeSerializer, PlanSerializer, BenefitSerializer, SchemeItemSerializer
from apps.schemes.services.scheme_service import SchemeService
from apps.schemes.services.plan_service import PlanService
from apps.schemes.services.benefit_service import BenefitService
from apps.schemes.services.scheme_item_service import SchemeItemService
from apps.schemes.selectors import (
    scheme_list,
    scheme_get,
    plan_list,
    plan_get,
    benefit_list,
    benefit_get,
    scheme_item_list,
    scheme_item_get,
)

class SchemeViewSet(viewsets.ModelViewSet):
    """
    Handles CRUD operations for Scheme entities.
    Uses SchemeService for business logic.
    """
    serializer_class = SchemeSerializer
    authentication_classes = [JWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ['status', 'company']
    search_fields = ['scheme_name', 'description']
    ordering_fields = ['created_at', 'updated_at', 'scheme_name']

    def get_queryset(self):
        query = self.request.query_params.get('search', '').strip()
        filters_dict = {
            'status': self.request.query_params.get('status'),
            'company': self.request.query_params.get('company'),
            'query': query,
        }
        return scheme_list(filters=filters_dict)

    def create(self, request, *args, **kwargs):
        """Create a new scheme using the service layer."""
        scheme = SchemeService.scheme_create(
            scheme_data=request.data, 
            user=request.user
        )
        serializer = self.get_serializer(scheme)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def update(self, request, *args, **kwargs):
        """Update a scheme using the service layer."""
        scheme = SchemeService.scheme_update(
            scheme_id=kwargs['pk'], 
            update_data=request.data, 
            user=request.user
        )
        serializer = self.get_serializer(scheme)
        return Response(serializer.data)

    def destroy(self, request, *args, **kwargs):
        """Override delete → perform soft-delete via the service layer."""
        SchemeService.scheme_deactivate(
            scheme_id=kwargs['pk'], 
            user=request.user
        )
        return Response(status=status.HTTP_204_NO_CONTENT)


class PlanViewSet(viewsets.ModelViewSet):
    """
    Handles CRUD operations for Plan entities.
    Uses PlanService for business logic.
    """
    serializer_class = PlanSerializer
    authentication_classes = [JWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ['status']
    search_fields = ['plan_name', 'description']
    ordering_fields = ['created_at', 'updated_at', 'plan_name']

    def get_queryset(self):
        query = self.request.query_params.get('search', '').strip()
        filters_dict = {
            'status': self.request.query_params.get('status'),
            'query': query,
        }
        return plan_list(filters=filters_dict)

    def create(self, request, *args, **kwargs):
        """Create a new plan using the service layer."""
        plan = PlanService.plan_create(
            plan_data=request.data, 
            user=request.user
        )
        serializer = self.get_serializer(plan)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def update(self, request, *args, **kwargs):
        """Update a plan using the service layer."""
        plan = PlanService.plan_update(
            plan_id=kwargs['pk'], 
            update_data=request.data, 
            user=request.user
        )
        serializer = self.get_serializer(plan)
        return Response(serializer.data)

    def destroy(self, request, *args, **kwargs):
        """Override delete → perform soft-delete via the service layer."""
        PlanService.plan_deactivate(
            plan_id=kwargs['pk'], 
            user=request.user
        )
        return Response(status=status.HTTP_204_NO_CONTENT)


class BenefitViewSet(viewsets.ModelViewSet):
    """
    Handles CRUD operations for Benefit entities.
    Uses BenefitService for business logic.
    """
    serializer_class = BenefitSerializer
    authentication_classes = [JWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]
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


class SchemeItemViewSet(viewsets.ModelViewSet):
    """
    Handles CRUD operations for SchemeItem entities.
    Uses SchemeItemService for business logic.
    """
    serializer_class = SchemeItemSerializer
    authentication_classes = [JWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ['status', 'scheme', 'content_type']
    search_fields = ['scheme__scheme_name', 'item__plan_name', 'item__benefit_name']
    ordering_fields = ['created_at', 'updated_at', 'scheme__scheme_name']

    def get_queryset(self):
        query = self.request.query_params.get('search', '').strip()
        filters_dict = {
            'status': self.request.query_params.get('status'),
            'scheme': self.request.query_params.get('scheme'),
            'content_type': self.request.query_params.get('content_type'),
            'query': query,
        }
        return scheme_item_list(filters=filters_dict)

    def create(self, request, *args, **kwargs):
        """Create a new scheme item using the service layer."""
        scheme_item = SchemeItemService.scheme_item_create(
            scheme_item_data=request.data, 
            user=request.user
        )
        serializer = self.get_serializer(scheme_item)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def update(self, request, *args, **kwargs):
        """Update a scheme item using the service layer."""
        scheme_item = SchemeItemService.scheme_item_update(
            scheme_item_id=kwargs['pk'], 
            update_data=request.data, 
            user=request.user
        )
        serializer = self.get_serializer(scheme_item)
        return Response(serializer.data)

    def destroy(self, request, *args, **kwargs):
        """Override delete → perform soft-delete via the service layer."""
        SchemeItemService.scheme_item_deactivate(
            scheme_item_id=kwargs['pk'], 
            user=request.user
        )
        return Response(status=status.HTTP_204_NO_CONTENT)