from django.core.exceptions import ValidationError
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters, status, viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.medical_catalog.api.serializers import LabTestSerializer
from apps.medical_catalog.models import LabTest
from apps.medical_catalog.services import LabTestService


class LabTestViewSet(viewsets.ModelViewSet):
    serializer_class = LabTestSerializer
    queryset = LabTest.objects.all()
    permission_classes = [IsAuthenticated]
    filter_backends = [
        DjangoFilterBackend,
        filters.SearchFilter,
        filters.OrderingFilter,
    ]
    filterset_fields = ["status", "category"]
    search_fields = ["name", "category", "units"]
    ordering_fields = ["created_at", "updated_at", "name", "base_amount"]

    def create(self, request, *args, **kwargs):
        try:
            instance = LabTestService.labtest_create(labtest_data=request.data, user=request.user)
            serializer = self.get_serializer(instance)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        except ValidationError as e:
            return Response({'error': 'Validation failed', 'details': e.message_dict}, status=status.HTTP_400_BAD_REQUEST)

    def update(self, request, *args, **kwargs):
        try:
            instance = LabTestService.labtest_update(
                labtest_id=kwargs["pk"], update_data=request.data, user=request.user
            )
            serializer = self.get_serializer(instance)
            return Response(serializer.data)
        except ValidationError as e:
            return Response({'error': 'Validation failed', 'details': e.message_dict}, status=status.HTTP_400_BAD_REQUEST)

    def destroy(self, request, *args, **kwargs):
        LabTestService.labtest_deactivate(labtest_id=kwargs["pk"], user=request.user)
        return Response(status=status.HTTP_204_NO_CONTENT)
