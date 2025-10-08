from rest_framework import viewsets
from base.models import *
from base.api.serializers import *

class IndustryViewSet(viewsets.ModelViewSet):
    queryset = Industry.objects.all()
    serializer_class = IndustrySerializer
    filterset_fields = ['status']
    search_fields = ['type_name', 'description']
    ordering_fields = ['created_at', 'updated_at', 'type_name']

class CompanyViewSet(viewsets.ModelViewSet):
    queryset = Company.objects.all()
    serializer_class = CompanySerializer
    filterset_fields = ['status', 'company_type']
    search_fields = ['company_name', 'contact_person', 'email', 'phone_number']
    ordering_fields = ['created_at', 'updated_at', 'company_name']