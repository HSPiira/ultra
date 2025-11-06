"""
ViewSet for Scheme Period management.
Handles period CRUD operations, renewals, and item management.
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.shortcuts import get_object_or_404

from apps.schemes.models import SchemePeriod, Scheme
from apps.schemes.api.serializers import SchemePeriodSerializer, SchemeRenewalSerializer
from apps.schemes.services.scheme_period_service import SchemePeriodService
from apps.schemes.selectors.scheme_period_selector import (
    scheme_period_list,
    scheme_period_get,
    scheme_period_list_by_scheme,
    scheme_period_statistics_get,
    scheme_period_expiring_soon,
)


class SchemePeriodViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing scheme periods.

    Supports:
    - Standard CRUD operations
    - Renewal workflow
    - Period statistics
    - Expiring periods lookup
    """

    queryset = SchemePeriod.objects.all()
    serializer_class = SchemePeriodSerializer
    filterset_fields = ["scheme", "period_number", "is_current", "status"]
    search_fields = ["scheme__scheme_name", "remark"]
    ordering_fields = ["period_number", "start_date", "end_date", "created_at"]
    ordering = ["-period_number"]

    def create(self, request, *args, **kwargs):
        """Create is not allowed - use Scheme creation or renewal instead."""
        return Response(
            {
                "error": "Use /api/schemes/{id}/renew/ to create new periods or create scheme with initial period"
            },
            status=status.HTTP_405_METHOD_NOT_ALLOWED,
        )

    def update(self, request, *args, **kwargs):
        """Update period using service layer."""
        period = self.get_object()

        try:
            updated_period = SchemePeriodService.scheme_period_update(
                period_id=period.id, update_data=request.data, user=request.user
            )

            serializer = self.get_serializer(updated_period)
            return Response(serializer.data)

        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=["post"])
    def terminate(self, request, pk=None):
        """
        Terminate a period before its end date.

        Body:
            - reason (optional): Reason for termination
        """
        period = self.get_object()
        reason = request.data.get("reason")

        try:
            terminated_period = SchemePeriodService.scheme_period_terminate(
                period_id=period.id, reason=reason, user=request.user
            )

            serializer = self.get_serializer(terminated_period)
            return Response(serializer.data)

        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=["post"])
    def activate(self, request, pk=None):
        """Reactivate a terminated or inactive period."""
        period = self.get_object()

        try:
            activated_period = SchemePeriodService.scheme_period_activate(
                period_id=period.id, user=request.user
            )

            serializer = self.get_serializer(activated_period)
            return Response(serializer.data)

        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=["get"])
    def expiring_soon(self, request):
        """
        Get periods expiring within specified days.

        Query params:
            - days (int): Number of days to look ahead (default: 30)
        """
        days = int(request.query_params.get("days", 30))

        periods = scheme_period_expiring_soon(days=days)
        serializer = self.get_serializer(periods, many=True)

        return Response(serializer.data)

    @action(detail=False, methods=["get"], url_path="by-scheme/(?P<scheme_id>[^/.]+)")
    def by_scheme(self, request, scheme_id=None):
        """
        Get all periods for a specific scheme.

        URL: /api/scheme-periods/by-scheme/{scheme_id}/
        """
        periods = scheme_period_list_by_scheme(scheme_id=scheme_id)
        serializer = self.get_serializer(periods, many=True)

        return Response(serializer.data)

    @action(
        detail=False,
        methods=["get"],
        url_path="statistics/(?P<scheme_id>[^/.]+)",
    )
    def statistics(self, request, scheme_id=None):
        """
        Get statistics for all periods of a scheme.

        URL: /api/scheme-periods/statistics/{scheme_id}/
        """
        try:
            stats = scheme_period_statistics_get(scheme_id=scheme_id)
            return Response(stats)

        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
