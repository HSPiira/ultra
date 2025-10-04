from rest_framework import viewsets
from base.models import *
from base.api.serializers import *

class CompanyTypeViewSet(viewsets.ModelViewSet):
    queryset = CompanyType.objects.all()
    serializer_class = CompanyTypeSerializer
    filterset_fields = ['status', 'is_active']
    search_fields = ['type_name', 'description']
    ordering_fields = ['created_at', 'updated_at', 'type_name']

class CompanyViewSet(viewsets.ModelViewSet):
    queryset = Company.objects.all()
    serializer_class = CompanySerializer
    filterset_fields = ['status', 'is_active', 'company_type']
    search_fields = ['company_name', 'contact_person', 'email', 'phone_number']
    ordering_fields = ['created_at', 'updated_at', 'company_name']

class SchemeViewSet(viewsets.ModelViewSet):
    queryset = Scheme.objects.all()
    serializer_class = SchemeSerializer
    filterset_fields = ['status', 'is_active', 'company']
    search_fields = ['scheme_name', 'description']
    ordering_fields = ['created_at', 'updated_at', 'scheme_name']