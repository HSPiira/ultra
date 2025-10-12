from rest_framework import serializers
from apps.companies.models import Company, Industry
from apps.core.utils.serializers import BaseSerializer

class IndustrySerializer(BaseSerializer):
    class Meta(BaseSerializer.Meta):
        model = Industry
        fields = BaseSerializer.Meta.fields + ['industry_name', 'description']
    
    def validate_industry_name(self, value):
        """Validate industry name."""
        if not value or len(value.strip()) < 2:
            raise serializers.ValidationError("Industry name must be at least 2 characters long")
        if len(value) > 100:
            raise serializers.ValidationError("Industry name cannot exceed 100 characters")
        return value.strip()
    
    def validate_description(self, value):
        """Validate description."""
        if value and len(value) > 500:
            raise serializers.ValidationError("Description cannot exceed 500 characters")
        return value

class CompanySerializer(BaseSerializer):
    industry_detail = IndustrySerializer(source='industry', read_only=True)
    
    class Meta(BaseSerializer.Meta):
        model = Company
        fields = BaseSerializer.Meta.fields + [
            'company_name', 'company_address', 'industry', 'industry_detail',
            'contact_person', 'email', 'phone_number', 'website', 'remark'
        ]
    
    def validate_company_name(self, value):
        """Validate company name."""
        if not value or len(value.strip()) < 2:
            raise serializers.ValidationError("Company name must be at least 2 characters long")
        if len(value) > 255:
            raise serializers.ValidationError("Company name cannot exceed 255 characters")
        return value.strip()
    
    def validate_email(self, value):
        """Validate email format."""
        if not value:
            raise serializers.ValidationError("Email is required")
        if '@' not in value or '.' not in value.split('@')[-1]:
            raise serializers.ValidationError("Enter a valid email address")
        return value.lower().strip()
    
    def validate_phone_number(self, value):
        """Validate phone number."""
        if not value:
            raise serializers.ValidationError("Phone number is required")
        # Remove common formatting characters
        clean_phone = value.replace('+', '').replace('-', '').replace(' ', '').replace('(', '').replace(')', '')
        if not clean_phone.isdigit() or len(clean_phone) < 10:
            raise serializers.ValidationError("Enter a valid phone number (at least 10 digits)")
        return value
    
    def validate_contact_person(self, value):
        """Validate contact person name."""
        if not value or len(value.strip()) < 2:
            raise serializers.ValidationError("Contact person name must be at least 2 characters long")
        return value.strip()
    
    def validate_website(self, value):
        """Validate website URL."""
        if value and not value.startswith(('http://', 'https://')):
            value = 'https://' + value
        return value