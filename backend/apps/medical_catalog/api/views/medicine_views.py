from django.core.exceptions import ValidationError
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters, status, viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.core.utils.caching import CacheableResponseMixin
from apps.medical_catalog.api.serializers import MedicineSerializer
from apps.medical_catalog.models import Medicine
from apps.medical_catalog.services import MedicineService


class MedicineViewSet(CacheableResponseMixin, viewsets.ModelViewSet):
    serializer_class = MedicineSerializer
    queryset = Medicine.objects.all()
    permission_classes = [IsAuthenticated]
    filter_backends = [
        DjangoFilterBackend,
        filters.SearchFilter,
        filters.OrderingFilter,
    ]
    filterset_fields = ["status", "dosage_form", "route"]
    search_fields = ["name", "dosage_form", "route"]
    ordering_fields = ["created_at", "updated_at", "name", "unit_price"]

    def create(self, request, *args, **kwargs):
        try:
            instance = MedicineService.medicine_create(medicine_data=request.data, user=request.user)
            serializer = self.get_serializer(instance)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        except ValidationError as e:
            return Response({'error': 'Validation failed', 'details': e.message_dict}, status=status.HTTP_400_BAD_REQUEST)

    def update(self, request, *args, **kwargs):
        try:
            instance = MedicineService.medicine_update(
                medicine_id=kwargs["pk"], update_data=request.data, user=request.user
            )
            serializer = self.get_serializer(instance)
            return Response(serializer.data)
        except ValidationError as e:
            return Response({'error': 'Validation failed', 'details': e.message_dict}, status=status.HTTP_400_BAD_REQUEST)

    def destroy(self, request, *args, **kwargs):
        MedicineService.medicine_deactivate(medicine_id=kwargs["pk"], user=request.user)
        return Response(status=status.HTTP_204_NO_CONTENT)
