from django.http import HttpResponse
from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import OpenApiParameter, extend_schema
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.core.utils.throttling import ExportRateThrottle, StrictRateThrottle
from apps.core.utils.caching import ThrottleAwareCacheMixin
from apps.companies.api.serializers import CompanySerializer
from apps.companies.selectors import (
    company_contact_info_get,
    company_data_integrity_check,
    company_health_score_get,
    company_health_scores_list,
    company_list_by_industry,
    company_list_needing_attention,
    company_list_with_recent_activity,
    company_schemes_list,
    company_search_advanced,
    company_statistics_get,
)

# JWT authentication removed - using global session authentication
from apps.companies.services.company_service import CompanyService


class CompanyAnalyticsViewSet(ThrottleAwareCacheMixin, viewsets.ViewSet):
    """
    Company analytics and advanced operations.
    """

    # Using global authentication settings from REST_FRAMEWORK
    serializer_class = CompanySerializer
    throttle_classes = [ExportRateThrottle, StrictRateThrottle]

    @action(detail=False, methods=["get"])
    def statistics(self, request):
        """Get comprehensive company statistics."""
        stats = company_statistics_get()
        return Response(stats)

    @action(detail=False, methods=["get"])
    def health_scores(self, request):
        """Get health scores for all companies."""
        health_data = company_health_scores_list()
        return Response(health_data)

    @action(detail=False, methods=["get"])
    def by_industry(self, request):
        """Get companies grouped by industry."""
        industry_id = request.query_params.get("industry_id")
        if industry_id:
            companies = company_list_by_industry(industry_id=industry_id)
        else:
            from apps.companies.selectors import company_list

            companies = company_list()

        serializer = CompanySerializer(companies, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=["get"])
    def with_recent_activity(self, request):
        """Get companies with recent scheme activity."""
        days = int(request.query_params.get("days", 30))
        companies = company_list_with_recent_activity(days=days)
        serializer = CompanySerializer(companies, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=["get"])
    def needing_attention(self, request):
        """Get companies that need attention."""
        companies = company_list_needing_attention()
        serializer = CompanySerializer(companies, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=["get"])
    def bulk_contact_info(self, request):
        """Get formatted contact information for companies."""
        company_ids = request.query_params.getlist("company_ids")
        if not company_ids:
            return Response(
                {"error": "company_ids parameter is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        contact_data = []
        for company_id in company_ids:
            contact_info = company_contact_info_get(company_id=company_id)
            if contact_info:
                contact_data.append(contact_info)

        return Response(contact_data)

    @action(detail=False, methods=["post"])
    def bulk_update_status(self, request):
        """Bulk update company status. Rate limited to 20/hour."""
        company_ids = request.data.get("company_ids", [])
        new_status = request.data.get("status")

        if not company_ids or not new_status:
            return Response(
                {"error": "company_ids and status are required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        updated_count = CompanyService.companies_bulk_status_update(
            company_ids=company_ids, new_status=new_status, user=request.user
        )

        return Response(
            {
                "message": f"Successfully updated {updated_count} companies",
                "updated_count": updated_count,
            }
        )

    @action(detail=False, methods=["post"])
    def advanced_search(self, request):
        """Advanced search with multiple criteria."""
        search_params = request.data
        companies = company_search_advanced(search_params=search_params)
        serializer = CompanySerializer(companies, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=["get"])
    def export_csv(self, request):
        """Export companies to CSV. Rate limited to 5/hour."""
        # Get filters from query parameters
        filters = {}
        if request.query_params.get("status"):
            filters["status"] = request.query_params.get("status")
        if request.query_params.get("industry"):
            filters["industry"] = request.query_params.get("industry")
        if request.query_params.get("query"):
            filters["query"] = request.query_params.get("query")

        csv_data = CompanyService.companies_export_csv(filters=filters)

        response = HttpResponse(csv_data, content_type="text/csv")
        response["Content-Disposition"] = 'attachment; filename="companies.csv"'
        return response

    @action(detail=False, methods=["get"])
    def data_integrity(self, request):
        """Run data integrity checks on companies."""
        integrity_results = company_data_integrity_check()
        return Response(integrity_results)

    @extend_schema(
        parameters=[
            OpenApiParameter(
                name="pk", type=OpenApiTypes.STR, location=OpenApiParameter.PATH
            ),
            OpenApiParameter(
                name="id", type=OpenApiTypes.STR, location=OpenApiParameter.PATH
            ),
        ]
    )
    @action(detail=True, methods=["get"])
    def health_score(self, request, pk: str | None = None):
        """Get health score for a specific company."""
        health_score = company_health_score_get(company_id=pk)
        if not health_score:
            return Response(
                {"error": "Company not found"}, status=status.HTTP_404_NOT_FOUND
            )
        return Response(health_score)

    @extend_schema(
        parameters=[
            OpenApiParameter(
                name="pk", type=OpenApiTypes.STR, location=OpenApiParameter.PATH
            ),
            OpenApiParameter(
                name="id", type=OpenApiTypes.STR, location=OpenApiParameter.PATH
            ),
        ]
    )
    @action(detail=True, methods=["get"])
    def schemes(self, request, pk: str | None = None):
        """Get all schemes for a specific company."""
        schemes = company_schemes_list(company_id=pk)
        from apps.schemes.api.serializers import SchemeSerializer

        serializer = SchemeSerializer(schemes, many=True)
        return Response(serializer.data)

    @extend_schema(
        parameters=[
            OpenApiParameter(
                name="pk", type=OpenApiTypes.STR, location=OpenApiParameter.PATH
            ),
            OpenApiParameter(
                name="id", type=OpenApiTypes.STR, location=OpenApiParameter.PATH
            ),
        ]
    )
    @action(detail=True, methods=["get"])
    def contact_info(self, request, pk: str | None = None):
        """Get formatted contact information for a specific company."""
        contact_info = company_contact_info_get(company_id=pk)
        if not contact_info:
            return Response(
                {"error": "Company not found"}, status=status.HTTP_404_NOT_FOUND
            )
        return Response(contact_info)

    @extend_schema(
        parameters=[
            OpenApiParameter(
                name="pk", type=OpenApiTypes.STR, location=OpenApiParameter.PATH
            ),
            OpenApiParameter(
                name="id", type=OpenApiTypes.STR, location=OpenApiParameter.PATH
            ),
        ]
    )
    @action(detail=True, methods=["post"])
    def suspend(self, request, pk: str | None = None):
        """Suspend a company with reason."""
        reason = request.data.get("reason", "No reason provided")
        company = CompanyService.company_suspend(
            company_id=pk, reason=reason, user=request.user
        )
        serializer = CompanySerializer(company)
        return Response(serializer.data)

    @extend_schema(
        parameters=[
            OpenApiParameter(
                name="pk", type=OpenApiTypes.STR, location=OpenApiParameter.PATH
            ),
            OpenApiParameter(
                name="id", type=OpenApiTypes.STR, location=OpenApiParameter.PATH
            ),
        ]
    )
    @action(detail=True, methods=["post"])
    def activate(self, request, pk: str | None = None):
        """Activate a company."""
        company = CompanyService.company_activate(company_id=pk, user=request.user)
        serializer = CompanySerializer(company)
        return Response(serializer.data)

    @extend_schema(
        parameters=[
            OpenApiParameter(
                name="pk", type=OpenApiTypes.STR, location=OpenApiParameter.PATH
            ),
            OpenApiParameter(
                name="id", type=OpenApiTypes.STR, location=OpenApiParameter.PATH
            ),
        ]
    )
    @action(detail=True, methods=["post"])
    def deactivate(self, request, pk: str | None = None):
        """Deactivate a company."""
        company = CompanyService.company_deactivate(company_id=pk, user=request.user)
        serializer = CompanySerializer(company)
        return Response(serializer.data)
