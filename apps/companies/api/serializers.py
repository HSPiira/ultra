from rest_framework import serializers
from base.models import *

class BaseSerializer(serializers.ModelSerializer):
    class Meta:
        fields = ['id', 'created_at', 'updated_at', 'status']
        read_only_fields = ['id', 'created_at', 'updated_at']

class IndustrySerializer(BaseSerializer):
    class Meta(BaseSerializer.Meta):
        model = Industry
        fields = BaseSerializer.Meta.fields + ['industry_name', 'description']

class CompanySerializer(BaseSerializer):
    class Meta(BaseSerializer.Meta):
        model = Company
        fields = BaseSerializer.Meta.fields + ['company_name', 'company_address', 'industry', 'contact_person', 'email', 'phone_number', 'website', 'remark']