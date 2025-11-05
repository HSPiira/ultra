from django.http import HttpResponse
from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import OpenApiParameter, extend_schema
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.core.utils.throttling import ExportRateThrottle, StrictRateThrottle
from apps.core.utils.caching import ThrottleAwareCacheMixin
from apps.companies.api.serializers import IndustrySerializer
from apps.companies.selectors import (
    industry_choices_get,
    industry_companies_list,
    industry_data_integrity_check,
    industry_health_score_get,
    industry_health_scores_list,
    industry_list_needing_attention,
    industry_list_with_most_companies,
    industry_list_without_companies,
    industry_statistics_get,
)

# JWT authentication removed - using global session authentication
from apps.companies.services.industry_service import IndustryService


class IndustryAnalyticsViewSet(ThrottleAwareCacheMixin, viewsets.ViewSet):
    """
    Industry analytics and advanced operations.
    """

    # Using global authentication settings from REST_FRAMEWORK
    serializer_class = IndustrySerializer
    throttle_classes = [ExportRateThrottle, StrictRateThrottle]

    @action(detail=False, methods=["get"])
    def statistics(self, request):
        """Get comprehensive industry statistics."""
        stats = industry_statistics_get()
        return Response(stats)

    @action(detail=False, methods=["get"])
    def health_scores(self, request):
        """Get health scores for all industries."""
        health_data = industry_health_scores_list()
        return Response(health_data)

    @action(detail=False, methods=["get"])
    def top_industries(self, request):
        """Get industries with the most companies."""
        limit = int(request.query_params.get("limit", 10))
        top_industries = industry_list_with_most_companies(limit=limit)

        serializer = IndustrySerializer(top_industries, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=["get"])
    def without_companies(self, request):
        """Get industries that have no associated companies."""
        industries = industry_list_without_companies()
        serializer = IndustrySerializer(industries, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=["get"])
    def needing_attention(self, request):
        """Get industries that need attention."""
        industries = industry_list_needing_attention()
        serializer = IndustrySerializer(industries, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=["get"])
    def choices(self, request):
        """Get industry choices for forms/dropdowns."""
        choices = industry_choices_get()
        return Response(choices)

    @action(detail=False, methods=["post"])
    def bulk_update_status(self, request):
        """Bulk update industry status."""
        industry_ids = request.data.get("industry_ids", [])
        new_status = request.data.get("status")

        if not industry_ids or not new_status:
            return Response(
                {"error": "industry_ids and status are required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        updated_count = IndustryService.industries_bulk_status_update(
            industry_ids=industry_ids, new_status=new_status, user=request.user
        )

        return Response(
            {
                "message": f"Successfully updated {updated_count} industries",
                "updated_count": updated_count,
            }
        )

    @action(detail=False, methods=["post"])
    def transfer_companies(self, request):
        """Transfer companies from one industry to another."""
        company_ids = request.data.get("company_ids", [])
        target_industry_id = request.data.get("target_industry_id")

        if not company_ids or not target_industry_id:
            return Response(
                {"error": "company_ids and target_industry_id are required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        transferred_count = IndustryService.companies_transfer_to_industry(
            company_ids=company_ids,
            target_industry_id=target_industry_id,
            user=request.user,
        )

        return Response(
            {
                "message": f"Successfully transferred {transferred_count} companies",
                "transferred_count": transferred_count,
            }
        )

    @action(detail=False, methods=["post"])
    def merge_industries(self, request):
        """Merge two industries."""
        source_industry_id = request.data.get("source_industry_id")
        target_industry_id = request.data.get("target_industry_id")

        if not source_industry_id or not target_industry_id:
            return Response(
                {"error": "source_industry_id and target_industry_id are required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        result = IndustryService.industries_merge(
            source_industry_id=source_industry_id,
            target_industry_id=target_industry_id,
            user=request.user,
        )

        return Response(result)

    @action(detail=False, methods=["get"])
    def export_csv(self, request):
        """Export industries to CSV."""
        # Get filters from query parameters
        filters = {}
        if request.query_params.get("status"):
            filters["status"] = request.query_params.get("status")
        if request.query_params.get("query"):
            filters["query"] = request.query_params.get("query")

        csv_data = IndustryService.industries_export_csv(filters=filters)

        response = HttpResponse(csv_data, content_type="text/csv")
        response["Content-Disposition"] = 'attachment; filename="industries.csv"'
        return response

    @action(detail=False, methods=["get"])
    def data_integrity(self, request):
        """Run data integrity checks on industries."""
        integrity_results = industry_data_integrity_check()
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
        """Get health score for a specific industry."""
        health_score = industry_health_score_get(industry_id=pk)
        if not health_score:
            return Response(
                {"error": "Industry not found"}, status=status.HTTP_404_NOT_FOUND
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
    def companies(self, request, pk: str | None = None):
        """Get all companies in a specific industry."""
        companies = industry_companies_list(industry_id=pk)
        from apps.companies.api.serializers import CompanySerializer

        serializer = CompanySerializer(companies, many=True)
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
    def suspend(self, request, pk: str | None = None):
        """Suspend an industry with reason."""
        reason = request.data.get("reason", "No reason provided")
        industry = IndustryService.industry_suspend(
            industry_id=pk, reason=reason, user=request.user
        )
        serializer = IndustrySerializer(industry)
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
        """Activate an industry."""
        industry = IndustryService.industry_activate(industry_id=pk, user=request.user)
        serializer = IndustrySerializer(industry)
        return Response(serializer.data)
