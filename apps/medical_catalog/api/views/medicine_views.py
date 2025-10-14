from rest_framework import viewsets, status
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters

from apps.medical_catalog.api.serializers import MedicineSerializer
from apps.medical_catalog.selectors import medicine_list
from apps.medical_catalog.services import MedicineService


class MedicineViewSet(viewsets.ModelViewSet):
    serializer_class = MedicineSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'dosage_form', 'route']
    search_fields = ['name', 'dosage_form', 'route']
    ordering_fields = ['created_at', 'updated_at', 'name', 'unit_price']

    def get_queryset(self):
        query = self.request.query_params.get('search', '').strip()
        filters_dict = {
            'status': self.request.query_params.get('status'),
            'query': query,
        }
        return medicine_list(filters=filters_dict)

    def create(self, request, *args, **kwargs):
        instance = MedicineService.create(data=request.data, user=request.user)
        serializer = self.get_serializer(instance)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def update(self, request, *args, **kwargs):
        instance = MedicineService.update(medicine_id=kwargs['pk'], data=request.data, user=request.user)
        serializer = self.get_serializer(instance)
        return Response(serializer.data)

    def destroy(self, request, *args, **kwargs):
        MedicineService.deactivate(medicine_id=kwargs['pk'], user=request.user)
        return Response(status=status.HTTP_204_NO_CONTENT)


