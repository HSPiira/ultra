from rest_framework import status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.viewsets import ViewSet

from apps.medical_catalog.selectors import medical_catalog_statistics_get


class MedicalCatalogStatisticsViewSet(ViewSet):
    permission_classes = []

    @action(detail=False, methods=['get'])
    def statistics(self, request):
        """Get comprehensive medical catalog statistics."""
        try:
            stats = medical_catalog_statistics_get()
            return Response(stats, status=status.HTTP_200_OK)
        except Exception as e:
            return Response(
                {'error': 'Failed to fetch statistics', 'details': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
