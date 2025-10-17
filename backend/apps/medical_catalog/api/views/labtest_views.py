from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters, status, viewsets
from rest_framework.response import Response

from apps.medical_catalog.api.serializers import LabTestSerializer
from apps.medical_catalog.selectors import labtest_list
from apps.medical_catalog.services import LabTestService


class LabTestViewSet(viewsets.ModelViewSet):
    serializer_class = LabTestSerializer
    filter_backends = [
        DjangoFilterBackend,
        filters.SearchFilter,
        filters.OrderingFilter,
    ]
    filterset_fields = ["status", "category"]
    search_fields = ["name", "category", "units"]
    ordering_fields = ["created_at", "updated_at", "name", "base_amount"]

    def get_queryset(self):
        query = self.request.query_params.get("search", "").strip()
        filters_dict = {
            "status": self.request.query_params.get("status"),
            "query": query,
        }
        return labtest_list(filters=filters_dict)

    def create(self, request, *args, **kwargs):
        instance = LabTestService.create(data=request.data, user=request.user)
        serializer = self.get_serializer(instance)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def update(self, request, *args, **kwargs):
        instance = LabTestService.update(
            labtest_id=kwargs["pk"], data=request.data, user=request.user
        )
        serializer = self.get_serializer(instance)
        return Response(serializer.data)

    def destroy(self, request, *args, **kwargs):
        LabTestService.deactivate(labtest_id=kwargs["pk"], user=request.user)
        return Response(status=status.HTTP_204_NO_CONTENT)
