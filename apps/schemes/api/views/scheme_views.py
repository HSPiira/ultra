from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters, status, viewsets
from rest_framework.response import Response

from apps.schemes.api.serializers import SchemeSerializer
from apps.schemes.models import Scheme
from apps.schemes.selectors import scheme_list
from apps.schemes.services.scheme_service import SchemeService


class SchemeViewSet(viewsets.ModelViewSet):
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
        """Create a new scheme using the service layer."""
        scheme = SchemeService.scheme_create(
            scheme_data=request.data, user=request.user
        )
        serializer = self.get_serializer(scheme)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def update(self, request, *args, **kwargs):
        """Update a scheme using the service layer."""
        scheme = SchemeService.scheme_update(
            scheme_id=kwargs["pk"], update_data=request.data, user=request.user
        )
        serializer = self.get_serializer(scheme)
        return Response(serializer.data)

    def destroy(self, request, *args, **kwargs):
        """Override delete → perform soft-delete via the service layer."""
        SchemeService.scheme_deactivate(scheme_id=kwargs["pk"], user=request.user)
        return Response(status=status.HTTP_204_NO_CONTENT)
