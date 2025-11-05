from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters, status, viewsets
from rest_framework.response import Response

from apps.core.utils.caching import CacheableResponseMixin
from apps.schemes.api.serializers import BenefitSerializer
from apps.schemes.selectors import benefit_list
from apps.schemes.services.benefit_service import BenefitService


class BenefitViewSet(CacheableResponseMixin, viewsets.ModelViewSet):
    """
    Handles CRUD operations for Benefit entities.
    Uses BenefitService for business logic.
    """

    serializer_class = BenefitSerializer
    # Using global authentication settings from REST_FRAMEWORK

    filter_backends = [
        DjangoFilterBackend,
        filters.SearchFilter,
        filters.OrderingFilter,
    ]
    filterset_fields = ["status"]
    search_fields = ["benefit_name", "description"]
    ordering_fields = ["created_at", "updated_at", "benefit_name"]

    def get_queryset(self):
        query = self.request.query_params.get("search", "").strip()
        filters_dict = {
            "status": self.request.query_params.get("status"),
            "query": query,
        }
        return benefit_list(filters=filters_dict)

    def create(self, request, *args, **kwargs):
        """Create a new benefit using the service layer."""
        user_id = request.user.id if request.user.is_authenticated else None
        benefit = BenefitService.benefit_create(
            benefit_data=request.data, user=request.user
        )
        serializer = self.get_serializer(benefit)
        response = Response(serializer.data, status=status.HTTP_201_CREATED)
        # Invalidate cache after successful create
        self.invalidate_cache(user_id=user_id)
        return response

    def update(self, request, *args, **kwargs):
        """Update a benefit using the service layer."""
        user_id = request.user.id if request.user.is_authenticated else None
        benefit = BenefitService.benefit_update(
            benefit_id=kwargs["pk"], update_data=request.data, user=request.user
        )
        serializer = self.get_serializer(benefit)
        response = Response(serializer.data)
        # Invalidate cache after successful update
        self.invalidate_cache(user_id=user_id)
        return response

    def destroy(self, request, *args, **kwargs):
        """Override delete → perform soft-delete via the service layer."""
        user_id = request.user.id if request.user.is_authenticated else None
        BenefitService.benefit_deactivate(benefit_id=kwargs["pk"], user=request.user)
        response = Response(status=status.HTTP_204_NO_CONTENT)
        # Invalidate cache after successful delete
        self.invalidate_cache(user_id=user_id)
        return response
