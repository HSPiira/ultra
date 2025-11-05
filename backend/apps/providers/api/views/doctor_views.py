from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters, status, viewsets
from rest_framework.response import Response

from apps.core.utils.caching import CacheableResponseMixin
from apps.providers.api.serializers import DoctorSerializer
from apps.providers.selectors import doctor_get, doctor_list
from apps.providers.services import DoctorService


class DoctorViewSet(CacheableResponseMixin, viewsets.ModelViewSet):
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
        user_id = request.user.id if request.user.is_authenticated else None
        # Validate serializer first to catch validation errors
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # Pass request.data to service as it handles nested affiliations_payload
        created_doctor = DoctorService.doctor_create(
            doctor_data=request.data, user=request.user
        )
        # Refresh doctor with prefetched relationships using selector
        doctor = doctor_get(doctor_id=created_doctor.id)
        if not doctor:
            return Response(
                {"error": "Doctor not found"}, 
                status=status.HTTP_404_NOT_FOUND
            )
        serializer = self.get_serializer(doctor)
        response = Response(serializer.data, status=status.HTTP_201_CREATED)
        # Invalidate cache after successful create
        self.invalidate_cache(user_id=user_id)
        return response

    def update(self, request, *args, **kwargs):
        user_id = request.user.id if request.user.is_authenticated else None
        # Validate serializer first to catch validation errors
        serializer = self.get_serializer(instance=self.get_object(), data=request.data, partial=kwargs.get('partial', False))
        serializer.is_valid(raise_exception=True)
        
        # Pass request.data to service as it handles nested affiliations_payload
        DoctorService.doctor_update(
            doctor_id=kwargs["pk"], update_data=request.data, user=request.user
        )
        # Refresh doctor with prefetched relationships using selector
        doctor = doctor_get(doctor_id=kwargs["pk"])
        if not doctor:
            return Response(
                {"error": "Doctor not found"}, 
                status=status.HTTP_404_NOT_FOUND
            )
        response = Response(self.get_serializer(doctor).data, status=status.HTTP_200_OK)
        # Invalidate cache after successful update
        self.invalidate_cache(user_id=user_id)
        return response

    def destroy(self, request, *args, **kwargs):
        user_id = request.user.id if request.user.is_authenticated else None
        DoctorService.doctor_deactivate(doctor_id=kwargs["pk"], user=request.user)
        response = Response(status=status.HTTP_204_NO_CONTENT)
        # Invalidate cache after successful delete
        self.invalidate_cache(user_id=user_id)
        return response
