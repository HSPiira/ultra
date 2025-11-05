from django.core.exceptions import ValidationError
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters, status, viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.core.utils.caching import CacheableResponseMixin
from apps.medical_catalog.api.serializers import ServiceSerializer
from apps.medical_catalog.models import Service
from apps.medical_catalog.services import ServiceService


class ServiceViewSet(CacheableResponseMixin, viewsets.ModelViewSet):
    serializer_class = ServiceSerializer
    queryset = Service.objects.all()
    permission_classes = [IsAuthenticated]
    filter_backends = [
        DjangoFilterBackend,
        filters.SearchFilter,
        filters.OrderingFilter,
    ]
    filterset_fields = ["status", "category", "service_type"]
    search_fields = ["name", "category", "service_type"]
    ordering_fields = ["created_at", "updated_at", "name", "base_amount"]

    def create(self, request, *args, **kwargs):
        user_id = request.user.id if request.user.is_authenticated else None
        try:
            instance = ServiceService.service_create(service_data=request.data, user=request.user)
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
            instance = ServiceService.service_update(
                service_id=kwargs["pk"], update_data=request.data, user=request.user
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
        ServiceService.service_deactivate(service_id=kwargs["pk"], user=request.user)
        response = Response(status=status.HTTP_204_NO_CONTENT)
        # Invalidate cache after successful delete
        self.invalidate_cache(user_id=user_id)
        return response
