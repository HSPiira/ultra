from apps.companies.models import *
from apps.core.utils.serializers import BaseSerializer

class IndustrySerializer(BaseSerializer):
    class Meta(BaseSerializer.Meta):
        model = Industry
        fields = BaseSerializer.Meta.fields + ['industry_name', 'description']

class CompanySerializer(BaseSerializer):
    class Meta(BaseSerializer.Meta):
        model = Company
        fields = BaseSerializer.Meta.fields + ['company_name', 'company_address', 'industry', 'contact_person', 'email', 'phone_number', 'website', 'remark']