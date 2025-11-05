from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters, status, viewsets
from rest_framework.response import Response

from apps.providers.api.serializers import DoctorSerializer
from apps.providers.selectors import doctor_get, doctor_list
from apps.providers.services import DoctorService


class DoctorViewSet(viewsets.ModelViewSet):
    serializer_class = DoctorSerializer
    filter_backends = [
        DjangoFilterBackend,
        filters.SearchFilter,
        filters.OrderingFilter,
    ]
    filterset_fields = ["hospitals"]  # status is handled in get_queryset() via selector
    search_fields = [
        "name",
        "specialization",
        "email",
        "phone_number",
        "license_number",
    ]
    ordering_fields = ["created_at", "updated_at", "name"]

    def get_queryset(self):
        query = self.request.query_params.get("search", "").strip()
        filters_dict = {
            "status": self.request.query_params.get("status"),
            "hospital": self.request.query_params.get("hospital"),
            "query": query,
        }
        return doctor_list(filters=filters_dict)

    def create(self, request, *args, **kwargs):
        # Validate serializer first to catch validation errors
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # Pass request.data to service as it handles nested affiliations_payload
        doctor = DoctorService.doctor_create(
            doctor_data=request.data, user=request.user
        )
        # Refresh doctor with prefetched relationships
        from apps.providers.models import Doctor
        doctor = Doctor.objects.prefetch_related("hospitals").prefetch_related("doctorhospitalaffiliation_set__hospital").get(pk=doctor.id)
        serializer = self.get_serializer(doctor)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def update(self, request, *args, **kwargs):
        # Validate serializer first to catch validation errors
        serializer = self.get_serializer(instance=self.get_object(), data=request.data, partial=kwargs.get('partial', False))
        serializer.is_valid(raise_exception=True)
        
        # Pass request.data to service as it handles nested affiliations_payload
        doctor = DoctorService.doctor_update(
            doctor_id=kwargs["pk"], update_data=request.data, user=request.user
        )
        # Refresh doctor with prefetched relationships
        from apps.providers.models import Doctor
        doctor = Doctor.objects.prefetch_related("hospitals").prefetch_related("doctorhospitalaffiliation_set__hospital").get(pk=doctor.id)
        return Response(self.get_serializer(doctor).data, status=status.HTTP_200_OK)

    def destroy(self, request, *args, **kwargs):
        DoctorService.doctor_deactivate(doctor_id=kwargs["pk"], user=request.user)
        return Response(status=status.HTTP_204_NO_CONTENT)
