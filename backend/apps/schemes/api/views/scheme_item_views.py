from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError
import logging

from apps.core.utils.throttling import StrictRateThrottle
from apps.core.utils.caching import ThrottleAwareCacheMixin
from apps.schemes.api.serializers import SchemeItemSerializer, BulkAssignmentSerializer
from apps.schemes.models import SchemeItem
from apps.schemes.selectors import (
    scheme_item_list,
    scheme_available_items_get,
    scheme_assigned_items_get,
)
from apps.schemes.services.scheme_item_service import SchemeItemService

logger = logging.getLogger(__name__)


class SchemeItemViewSet(ThrottleAwareCacheMixin, viewsets.ModelViewSet):
    """
    Handles CRUD operations for SchemeItem entities.
    Uses SchemeItemService for business logic.
    """

    serializer_class = SchemeItemSerializer
    throttle_classes = [StrictRateThrottle]  # Apply to bulk operations
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

    @action(detail=False, methods=["post"], url_path="bulk")
    def bulk_create(self, request):
        """Bulk create scheme items for a specific scheme. Rate limited to 20/hour."""
        serializer = BulkAssignmentSerializer(data=request.data)
        
        try:
            serializer.is_valid(raise_exception=True)
            validated_data = serializer.validated_data
            
            created_items = SchemeItemService.scheme_items_bulk_create(
                scheme_id=validated_data['scheme_id'],
                assignments=validated_data['assignments'],
                user=request.user
            )
            
            response_serializer = self.get_serializer(created_items, many=True)
            return Response(response_serializer.data, status=status.HTTP_201_CREATED)
            
        except ValidationError as e:
            return Response(
                {"errors": e.detail}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            logger.error(f"Unexpected error in bulk_create: {str(e)}", exc_info=True)
            return Response(
                {"error": "An internal server error occurred"}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=["post"], url_path="bulk-remove")
    def bulk_remove(self, request):
        """Bulk remove scheme items. Rate limited to 20/hour."""
        scheme_item_ids = request.data.get("scheme_item_ids", [])
        
        if not scheme_item_ids:
            return Response(
                {"error": "scheme_item_ids list is required"}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            removed_count = SchemeItemService.scheme_items_bulk_remove(
                scheme_item_ids=scheme_item_ids,
                user=request.user
            )
            return Response(
                {"removed_count": removed_count}, 
                status=status.HTTP_200_OK
            )
        except Exception as e:
            return Response(
                {"error": str(e)}, 
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=False, methods=["get"], url_path="scheme/(?P<scheme_id>[^/.]+)/items")
    def get_scheme_items(self, request, scheme_id=None):
        """Get all items assigned to a specific scheme."""
        content_type = request.query_params.get("content_type")
        
        try:
            assigned_items = scheme_assigned_items_get(
                scheme_id=scheme_id,
                content_type=content_type
            )
            serializer = self.get_serializer(assigned_items, many=True)
            return Response(serializer.data)
        except Exception as e:
            return Response(
                {"error": str(e)}, 
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=False, methods=["get"], url_path="scheme/(?P<scheme_id>[^/.]+)/available")
    def get_available_items(self, request, scheme_id=None):
        """Get available items for assignment to a scheme."""
        content_type = request.query_params.get("type")
        
        if not content_type:
            return Response(
                {"error": "type parameter is required"}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            available_items = scheme_available_items_get(
                scheme_id=scheme_id,
                content_type=content_type
            )
            
            # Convert to list of dictionaries for JSON response
            items_data = []
            for item in available_items:
                items_data.append({
                    "id": item.id,
                    "name": str(item),
                    "content_type": content_type,
                    "status": getattr(item, "status", "ACTIVE"),
                })
            
            return Response(items_data)
        except Exception as e:
            return Response(
                {"error": str(e)}, 
                status=status.HTTP_400_BAD_REQUEST
            )
