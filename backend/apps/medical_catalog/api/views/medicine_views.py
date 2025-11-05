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
        user_id = request.user.id if request.user.is_authenticated else None
        try:
            instance = MedicineService.medicine_create(medicine_data=request.data, user=request.user)
            serializer = self.get_serializer(instance)
            response = Response(serializer.data, status=status.HTTP_201_CREATED)
            # Invalidate cache after successful create
            self.invalidate_cache(user_id=user_id)
            return response
        except ValidationError as e:
            return Response({'error': 'Validation failed', 'details': e.message_dict}, status=status.HTTP_400_BAD_REQUEST)

    def update(self, request, *args, **kwargs):
        user_id = request.user.id if request.user.is_authenticated else None
        try:
            instance = MedicineService.medicine_update(
                medicine_id=kwargs["pk"], update_data=request.data, user=request.user
            )
            serializer = self.get_serializer(instance)
            response = Response(serializer.data)
            # Invalidate cache after successful update
            self.invalidate_cache(user_id=user_id)
            return response
        except ValidationError as e:
            return Response({'error': 'Validation failed', 'details': e.message_dict}, status=status.HTTP_400_BAD_REQUEST)

    def destroy(self, request, *args, **kwargs):
        user_id = request.user.id if request.user.is_authenticated else None
        MedicineService.medicine_deactivate(medicine_id=kwargs["pk"], user=request.user)
        response = Response(status=status.HTTP_204_NO_CONTENT)
        # Invalidate cache after successful delete
        self.invalidate_cache(user_id=user_id)
        return response
