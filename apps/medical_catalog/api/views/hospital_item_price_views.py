from rest_framework import viewsets, status
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters

from apps.medical_catalog.api.serializers import HospitalItemPriceSerializer
from apps.medical_catalog.selectors import hospital_item_price_list
from apps.medical_catalog.services import HospitalItemPriceService


class HospitalItemPriceViewSet(viewsets.ModelViewSet):
    serializer_class = HospitalItemPriceSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'hospital', 'available']
    search_fields = []
    ordering_fields = ['created_at', 'updated_at', 'amount']

    def get_queryset(self):
        filters_dict = {
            'status': self.request.query_params.get('status'),
            'hospital': self.request.query_params.get('hospital'),
            'available': self.request.query_params.get('available'),
        }
        return hospital_item_price_list(filters=filters_dict)

    def create(self, request, *args, **kwargs):
        instance = HospitalItemPriceService.create(data=request.data, user=request.user)
        serializer = self.get_serializer(instance)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def update(self, request, *args, **kwargs):
        instance = HospitalItemPriceService.update(price_id=kwargs['pk'], data=request.data, user=request.user)
        serializer = self.get_serializer(instance)
        return Response(serializer.data)

    def destroy(self, request, *args, **kwargs):
        HospitalItemPriceService.deactivate(price_id=kwargs['pk'], user=request.user)
        return Response(status=status.HTTP_204_NO_CONTENT)


