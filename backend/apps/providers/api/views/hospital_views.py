from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters, status, viewsets
from rest_framework.response import Response

from apps.core.utils.caching import CacheableResponseMixin
from apps.providers.api.serializers import HospitalSerializer
from apps.providers.selectors import hospital_list
from apps.providers.services import HospitalService


class HospitalViewSet(CacheableResponseMixin, viewsets.ModelViewSet):
    serializer_class = HospitalSerializer
    filter_backends = [
        DjangoFilterBackend,
        filters.SearchFilter,
        filters.OrderingFilter,
    ]
    filterset_fields = ["branch_of"]  # status is handled in get_queryset() via selector
    search_fields = ["name", "contact_person", "email", "phone_number"]
    ordering_fields = ["created_at", "updated_at", "name"]

    def get_queryset(self):
        query = self.request.query_params.get("search", "").strip()
        filters_dict = {
            "status": self.request.query_params.get("status"),
            "branch_of": self.request.query_params.get("branch_of"),
            "query": query,
        }
        return hospital_list(filters=filters_dict)

    def create(self, request, *args, **kwargs):
        user_id = request.user.id if request.user.is_authenticated else None
        hospital = HospitalService.hospital_create(
            hospital_data=request.data, user=request.user
        )
        serializer = self.get_serializer(hospital)
        response = Response(serializer.data, status=status.HTTP_201_CREATED)
        # Invalidate cache after successful create
        self.invalidate_cache(user_id=user_id)
        return response

    def update(self, request, *args, **kwargs):
        user_id = request.user.id if request.user.is_authenticated else None
        hospital = HospitalService.hospital_update(
            hospital_id=kwargs["pk"], update_data=request.data, user=request.user
        )
        serializer = self.get_serializer(hospital)
        response = Response(serializer.data)
        # Invalidate cache after successful update
        self.invalidate_cache(user_id=user_id)
        return response

    def destroy(self, request, *args, **kwargs):
        user_id = request.user.id if request.user.is_authenticated else None
        HospitalService.hospital_deactivate(hospital_id=kwargs["pk"], user=request.user)
        response = Response(status=status.HTTP_204_NO_CONTENT)
        # Invalidate cache after successful delete
        self.invalidate_cache(user_id=user_id)
        return response
