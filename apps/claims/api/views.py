from rest_framework import viewsets, status
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters

from apps.claims.api.serializers import ClaimSerializer
from apps.claims.services import ClaimService
from apps.claims.selectors import claim_list


class ClaimViewSet(viewsets.ModelViewSet):
    serializer_class = ClaimSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['claim_status', 'member', 'hospital', 'doctor']
    search_fields = ['invoice_number']
    ordering_fields = ['service_date', 'created_at']

    def get_queryset(self):
        params = self.request.query_params
        filters_dict = {
            'member': params.get('member'),
            'hospital': params.get('hospital'),
            'doctor': params.get('doctor'),
            'status': params.get('claim_status'),
            'date_from': params.get('date_from'),
            'date_to': params.get('date_to'),
            'query': params.get('search', '').strip(),
        }
        return claim_list(filters=filters_dict)

    def create(self, request, *args, **kwargs):
        claim = ClaimService.create_claim(data=request.data, user=request.user)
        return Response(self.get_serializer(claim).data, status=status.HTTP_201_CREATED)

    def update(self, request, *args, **kwargs):
        claim = ClaimService.update_claim(claim_id=kwargs['pk'], data=request.data, user=request.user)
        return Response(self.get_serializer(claim).data, status=status.HTTP_200_OK)

    def destroy(self, request, *args, **kwargs):
        ClaimService.delete_claim(claim_id=kwargs['pk'], user=request.user)
        return Response(status=status.HTTP_204_NO_CONTENT)


