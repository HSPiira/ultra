from rest_framework import serializers
from drf_spectacular.utils import extend_schema_field
from apps.schemes.models import Scheme, Plan, Benefit, SchemeItem
from apps.core.utils.serializers import BaseSerializer

class SchemeSerializer(BaseSerializer):
    company_detail = serializers.SerializerMethodField()
    
    class Meta(BaseSerializer.Meta):
        model = Scheme
        fields = BaseSerializer.Meta.fields + [
            'scheme_name', 'company', 'company_detail', 'description', 'card_code', 
            'start_date', 'end_date', 'termination_date', 'limit_amount', 
            'family_applicable', 'remark'
        ]
    
    @extend_schema_field({
        'type': 'object',
        'nullable': True,
        'properties': {
            'id': {'type': 'string'},
            'company_name': {'type': 'string'},
            'contact_person': {'type': 'string'},
            'email': {'type': 'string', 'format': 'email'},
        }
    })
    def get_company_detail(self, obj):
        if obj.company:
            return {
                'id': obj.company.id,
                'company_name': obj.company.company_name,
                'contact_person': obj.company.contact_person,
                'email': obj.company.email
            }
        return None
    
    def validate_scheme_name(self, value):
        """Validate scheme name."""
        if not value or len(value.strip()) < 2:
            raise serializers.ValidationError("Scheme name must be at least 2 characters long")
        if len(value) > 255:
            raise serializers.ValidationError("Scheme name cannot exceed 255 characters")
        return value.strip()
    
    def validate_card_code(self, value):
        """Validate card code."""
        if not value or len(value.strip()) != 3:
            raise serializers.ValidationError("Card code must be exactly 3 characters")
        return value.strip().upper()
    
    def validate_description(self, value):
        """Validate description."""
        if value and len(value) > 500:
            raise serializers.ValidationError("Description cannot exceed 500 characters")
        return value
    
    def validate_limit_amount(self, value):
        """Validate limit amount."""
        if value is not None and value < 0:
            raise serializers.ValidationError("Limit amount cannot be negative")
        return value
    
    def validate(self, data):
        """Cross-field validation."""
        start_date = data.get('start_date')
        end_date = data.get('end_date')
        termination_date = data.get('termination_date')
        
        if start_date and end_date and start_date >= end_date:
            raise serializers.ValidationError("End date must be after start date")
        
        if termination_date and end_date and termination_date <= end_date:
            raise serializers.ValidationError("Termination date must be after end date")
        
        return data


class PlanSerializer(BaseSerializer):
    class Meta(BaseSerializer.Meta):
        model = Plan
        fields = BaseSerializer.Meta.fields + ['plan_name', 'description']
    
    def validate_plan_name(self, value):
        """Validate plan name."""
        if not value or len(value.strip()) < 2:
            raise serializers.ValidationError("Plan name must be at least 2 characters long")
        if len(value) > 255:
            raise serializers.ValidationError("Plan name cannot exceed 255 characters")
        return value.strip()
    
    def validate_description(self, value):
        """Validate description."""
        if value and len(value) > 500:
            raise serializers.ValidationError("Description cannot exceed 500 characters")
        return value


class BenefitSerializer(BaseSerializer):
    class Meta(BaseSerializer.Meta):
        model = Benefit
        fields = BaseSerializer.Meta.fields + [
            'benefit_name', 'description', 'in_or_out_patient', 'limit_amount'
        ]
    
    def validate_benefit_name(self, value):
        """Validate benefit name."""
        if not value or len(value.strip()) < 2:
            raise serializers.ValidationError("Benefit name must be at least 2 characters long")
        if len(value) > 255:
            raise serializers.ValidationError("Benefit name cannot exceed 255 characters")
        return value.strip()
    
    def validate_description(self, value):
        """Validate description."""
        if value and len(value) > 500:
            raise serializers.ValidationError("Description cannot exceed 500 characters")
        return value
    
    def validate_in_or_out_patient(self, value):
        """Validate patient type."""
        valid_choices = ['INPATIENT', 'OUTPATIENT', 'BOTH']
        if value not in valid_choices:
            raise serializers.ValidationError(f"Invalid patient type. Must be one of: {', '.join(valid_choices)}")
        return value
    
    def validate_limit_amount(self, value):
        """Validate limit amount."""
        if value is not None and value < 0:
            raise serializers.ValidationError("Limit amount cannot be negative")
        return value


class SchemeItemSerializer(BaseSerializer):
    scheme_detail = serializers.SerializerMethodField()
    item_detail = serializers.SerializerMethodField()
    
    class Meta(BaseSerializer.Meta):
        model = SchemeItem
        fields = BaseSerializer.Meta.fields + [
            'scheme', 'scheme_detail', 'content_type', 'object_id', 'item_detail',
            'limit_amount', 'copayment_percent'
        ]
    
    @extend_schema_field({
        'type': 'object',
        'nullable': True,
        'properties': {
            'id': {'type': 'string'},
            'scheme_name': {'type': 'string'},
            'card_code': {'type': 'string'},
        }
    })
    def get_scheme_detail(self, obj):
        if obj.scheme:
            return {
                'id': obj.scheme.id,
                'scheme_name': obj.scheme.scheme_name,
                'card_code': obj.scheme.card_code
            }
        return None
    
    @extend_schema_field({
        'type': 'object',
        'nullable': True,
        'properties': {
            'id': {'type': 'string'},
            'name': {'type': 'string'},
            'type': {'type': 'string'},
        }
    })
    def get_item_detail(self, obj):
        if obj.item:
            return {
                'id': obj.item.id,
                'name': str(obj.item),
                'type': obj.content_type.model if obj.content_type else None
            }
        return None
    
    def validate_limit_amount(self, value):
        """Validate limit amount."""
        if value is not None and value < 0:
            raise serializers.ValidationError("Limit amount cannot be negative")
        return value
    
    def validate_copayment_percent(self, value):
        """Validate copayment percentage."""
        if value is not None:
            if value < 0:
                raise serializers.ValidationError("Copayment percentage cannot be negative")
            if value > 100:
                raise serializers.ValidationError("Copayment percentage cannot exceed 100")
        return value