from rest_framework import viewsets
from apps.schemes.models import *
from apps.schemes.api.serializers import *

class SchemeViewSet(viewsets.ModelViewSet):
    queryset = Scheme.objects.all()
    serializer_class = SchemeSerializer
    filterset_fields = ['status', 'company']
    search_fields = ['scheme_name', 'description']
    ordering_fields = ['created_at', 'updated_at', 'scheme_name']