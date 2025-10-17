from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters, status, viewsets
from rest_framework.response import Response

from apps.medical_catalog.api.serializers import ServiceSerializer
from apps.medical_catalog.selectors import service_list
from apps.medical_catalog.services import ServiceService


class ServiceViewSet(viewsets.ModelViewSet):
    serializer_class = ServiceSerializer
    filter_backends = [
        DjangoFilterBackend,
        filters.SearchFilter,
        filters.OrderingFilter,
    ]
    filterset_fields = ["status", "category", "service_type"]
    search_fields = ["name", "category", "service_type"]
    ordering_fields = ["created_at", "updated_at", "name", "base_amount"]

    def get_queryset(self):
        query = self.request.query_params.get("search", "").strip()
        filters_dict = {
            "status": self.request.query_params.get("status"),
            "query": query,
        }
        return service_list(filters=filters_dict)

    def create(self, request, *args, **kwargs):
        instance = ServiceService.create(data=request.data, user=request.user)
        serializer = self.get_serializer(instance)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def update(self, request, *args, **kwargs):
        instance = ServiceService.update(
            service_id=kwargs["pk"], data=request.data, user=request.user
        )
        serializer = self.get_serializer(instance)
        return Response(serializer.data)

    def destroy(self, request, *args, **kwargs):
        ServiceService.deactivate(service_id=kwargs["pk"], user=request.user)
        return Response(status=status.HTTP_204_NO_CONTENT)
