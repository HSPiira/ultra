from rest_framework import viewsets, status
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters

from apps.providers.api.serializers import DoctorSerializer
from apps.providers.services import DoctorService
from apps.providers.selectors import doctor_list


class DoctorViewSet(viewsets.ModelViewSet):
    serializer_class = DoctorSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'hospital']
    search_fields = ['name', 'specialization', 'email', 'phone_number', 'license_number']
    ordering_fields = ['created_at', 'updated_at', 'name']

    def get_queryset(self):
        query = self.request.query_params.get('search', '').strip()
        filters_dict = {
            'status': self.request.query_params.get('status'),
            'hospital': self.request.query_params.get('hospital'),
            'query': query,
        }
        return doctor_list(filters=filters_dict)

    def create(self, request, *args, **kwargs):
        doctor = DoctorService.create(doctor_data=request.data, user=request.user)
        serializer = self.get_serializer(doctor)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def update(self, request, *args, **kwargs):
        doctor = DoctorService.update(
            doctor_id=kwargs['pk'], update_data=request.data, user=request.user
        )
        serializer = self.get_serializer(doctor)
        return Response(serializer.data)

    def destroy(self, request, *args, **kwargs):
        DoctorService.deactivate(doctor_id=kwargs['pk'], user=request.user)
        return Response(status=status.HTTP_204_NO_CONTENT)
