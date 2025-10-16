from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters, status, viewsets
from rest_framework.response import Response

from apps.schemes.api.serializers import PlanSerializer
from apps.schemes.selectors import plan_list
from apps.schemes.services.plan_service import PlanService


class PlanViewSet(viewsets.ModelViewSet):
    """
    Handles CRUD operations for Plan entities.
    Uses PlanService for business logic.
    """

    serializer_class = PlanSerializer
    # Using global authentication settings from REST_FRAMEWORK

    filter_backends = [
        DjangoFilterBackend,
        filters.SearchFilter,
        filters.OrderingFilter,
    ]
    filterset_fields = ["status"]
    search_fields = ["plan_name", "description"]
    ordering_fields = ["created_at", "updated_at", "plan_name"]

    def get_queryset(self):
        query = self.request.query_params.get("search", "").strip()
        filters_dict = {
            "status": self.request.query_params.get("status"),
            "query": query,
        }
        return plan_list(filters=filters_dict)

    def create(self, request, *args, **kwargs):
        """Create a new plan using the service layer."""
        plan = PlanService.plan_create(plan_data=request.data, user=request.user)
        serializer = self.get_serializer(plan)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def update(self, request, *args, **kwargs):
        """Update a plan using the service layer."""
        plan = PlanService.plan_update(
            plan_id=kwargs["pk"], update_data=request.data, user=request.user
        )
        serializer = self.get_serializer(plan)
        return Response(serializer.data)

    def destroy(self, request, *args, **kwargs):
        """Override delete → perform soft-delete via the service layer."""
        PlanService.plan_deactivate(plan_id=kwargs["pk"], user=request.user)
        return Response(status=status.HTTP_204_NO_CONTENT)
