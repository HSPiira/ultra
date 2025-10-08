from rest_framework import viewsets
from apps.schemes.models import *
from apps.schemes.api.serializers import *

class SchemeViewSet(viewsets.ModelViewSet):
    queryset = Scheme.objects.all()
    serializer_class = SchemeSerializer
    filterset_fields = ['status', 'company']
    search_fields = ['scheme_name', 'description']
    ordering_fields = ['created_at', 'updated_at', 'scheme_name']

class PlanViewSet(viewsets.ModelViewSet):
    queryset = Plan.objects.all()
    serializer_class = PlanSerializer
    filterset_fields = ['status']
    search_fields = ['plan_name', 'description']
    ordering_fields = ['created_at', 'updated_at', 'plan_name']

class BenefitViewSet(viewsets.ModelViewSet):
    queryset = Benefit.objects.all()
    serializer_class = BenefitSerializer
    filterset_fields = ['status']
    search_fields = ['benefit_name', 'description']
    ordering_fields = ['created_at', 'updated_at', 'benefit_name']

class SchemeItemViewSet(viewsets.ModelViewSet):
    queryset = SchemeItem.objects.all()
    serializer_class = SchemeItemSerializer
    filterset_fields = ['status', 'scheme', 'content_type']
    search_fields = ['scheme__scheme_name', 'item__plan_name', 'item__benefit_name']
    ordering_fields = ['created_at', 'updated_at', 'scheme__scheme_name']