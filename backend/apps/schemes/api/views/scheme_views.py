from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.core.utils.caching import CacheableResponseMixin
from apps.schemes.api.serializers import SchemeSerializer, SchemeRenewalSerializer, SchemePeriodSerializer
from apps.schemes.models import Scheme
from apps.schemes.selectors import scheme_list
from apps.schemes.services.scheme_service import SchemeService
from apps.schemes.services.scheme_period_service import SchemePeriodService


class SchemeViewSet(CacheableResponseMixin, viewsets.ModelViewSet):
    """
    Handles CRUD operations for Scheme entities.
    Uses SchemeService for business logic.
    """

    serializer_class = SchemeSerializer
    # Using global authentication settings from REST_FRAMEWORK

    filter_backends = [
        DjangoFilterBackend,
        filters.SearchFilter,
        filters.OrderingFilter,
    ]
    filterset_fields = ["status", "company"]
    search_fields = ["scheme_name", "description"]
    ordering_fields = ["created_at", "updated_at", "scheme_name"]

    def get_queryset(self):
        query = self.request.query_params.get("search", "").strip()
        filters_dict = {
            "status": self.request.query_params.get("status"),
            "company": self.request.query_params.get("company"),
            "query": query,
        }
        return scheme_list(filters=filters_dict)

    def create(self, request, *args, **kwargs):
        """Create a new scheme using the serializer."""
        user_id = request.user.id if request.user.is_authenticated else None
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        scheme = SchemeService.scheme_create(
            scheme_data=serializer.validated_data, user=request.user
        )
        response_serializer = self.get_serializer(scheme)
        response = Response(response_serializer.data, status=status.HTTP_201_CREATED)
        # Invalidate cache after successful create
        self.invalidate_cache(user_id=user_id)
        return response

    def update(self, request, *args, **kwargs):
        """Update a scheme using the serializer."""
        user_id = request.user.id if request.user.is_authenticated else None
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=kwargs.get('partial', False))
        serializer.is_valid(raise_exception=True)
        scheme = SchemeService.scheme_update(
            scheme_id=kwargs["pk"], update_data=serializer.validated_data, user=request.user
        )
        response_serializer = self.get_serializer(scheme)
        response = Response(response_serializer.data)
        # Invalidate cache after successful update
        self.invalidate_cache(user_id=user_id)
        return response

    def destroy(self, request, *args, **kwargs):
        """Override delete → perform soft-delete via the service layer."""
        user_id = request.user.id if request.user.is_authenticated else None
        SchemeService.scheme_deactivate(scheme_id=kwargs["pk"], user=request.user)
        response = Response(status=status.HTTP_204_NO_CONTENT)
        # Invalidate cache after successful delete
        self.invalidate_cache(user_id=user_id)
        return response

    @action(detail=True, methods=["post"])
    def renew(self, request, pk=None):
        """
        Renew a scheme for a new period.

        Body:
            - start_date (required): Start date of new period
            - end_date (required): End date of new period
            - limit_amount (optional): Limit amount (defaults to previous period)
            - copy_items (bool, default=True): Copy items from previous period
            - item_modifications (JSON, optional): Modifications to apply to copied items
        """
        scheme = self.get_object()
        serializer = SchemeRenewalSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            new_period = SchemePeriodService.scheme_period_renew_with_items(
                scheme_id=scheme.id,
                renewal_data=serializer.validated_data,
                copy_items=serializer.validated_data.get("copy_items", True),
                item_modifications=serializer.validated_data.get("item_modifications"),
                user=request.user,
            )

            return Response(
                SchemePeriodSerializer(new_period).data,
                status=status.HTTP_201_CREATED,
            )

        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
