from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters, status, viewsets
from rest_framework.response import Response

from apps.schemes.api.serializers import SchemeItemSerializer
from apps.schemes.models import SchemeItem
from apps.schemes.selectors import scheme_item_list
from apps.schemes.services.scheme_item_service import SchemeItemService


class SchemeItemViewSet(viewsets.ModelViewSet):
    """
    Handles CRUD operations for SchemeItem entities.
    Uses SchemeItemService for business logic.
    """

    serializer_class = SchemeItemSerializer
    # Using global authentication settings from REST_FRAMEWORK

    filter_backends = [
        DjangoFilterBackend,
        filters.SearchFilter,
        filters.OrderingFilter,
    ]
    filterset_fields = ["status", "scheme", "content_type"]
    search_fields = ["scheme__scheme_name", "item__plan_name", "item__benefit_name"]
    ordering_fields = ["created_at", "updated_at", "scheme__scheme_name"]

    def get_queryset(self):
        query = self.request.query_params.get("search", "").strip()
        filters_dict = {
            "status": self.request.query_params.get("status"),
            "scheme": self.request.query_params.get("scheme"),
            "content_type": self.request.query_params.get("content_type"),
            "query": query,
        }
        return scheme_item_list(filters=filters_dict)

    def create(self, request, *args, **kwargs):
        """Create a new scheme item using the service layer."""
        scheme_item = SchemeItemService.scheme_item_create(
            scheme_item_data=request.data, user=request.user
        )
        serializer = self.get_serializer(scheme_item)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def update(self, request, *args, **kwargs):
        """Update a scheme item using the service layer."""
        scheme_item = SchemeItemService.scheme_item_update(
            scheme_item_id=kwargs["pk"], update_data=request.data, user=request.user
        )
        serializer = self.get_serializer(scheme_item)
        return Response(serializer.data)

    def destroy(self, request, *args, **kwargs):
        """Override delete → perform soft-delete via the service layer."""
        SchemeItemService.scheme_item_deactivate(
            scheme_item_id=kwargs["pk"], user=request.user
        )
        return Response(status=status.HTTP_204_NO_CONTENT)
