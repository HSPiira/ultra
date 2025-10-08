from rest_framework import serializers
from apps.schemes.models import *
from apps.core.utils.serializers import BaseSerializer
from django.core.exceptions import ValidationError

class SchemeSerializer(BaseSerializer):
    class Meta(BaseSerializer.Meta):
        model = Scheme
        fields = BaseSerializer.Meta.fields + [
            'scheme_name', 'company', 'description', 'card_code', 'start_date', 'end_date', 'termination_date', 'limit_amount', 'family_applicable', 'remark'
            ]

    def validate(self, data):
        instance = Scheme(**data)
        try:
            instance.full_clean()
        except ValidationError as e:
            raise serializers.ValidationError(e.message_dict)
        return data
    
class PlanSerializer(BaseSerializer):
    class Meta(BaseSerializer.Meta):
        model = Plan
        fields = BaseSerializer.Meta.fields + ['plan_name', 'description']

class BenefitSerializer(BaseSerializer):
    class Meta(BaseSerializer.Meta):
        model = Benefit
        fields = BaseSerializer.Meta.fields + [
            'benefit_name', 'description', 'in_or_out_patient', 'limit_amount'
            ]

        def validate(self, data):
            instance = Benefit(**data)
            try:
                instance.full_clean()
            except ValidationError as e:
                raise serializers.ValidationError(e.message_dict)
            return data
        
class SchemeItemSerializer(BaseSerializer):
    class Meta(BaseSerializer.Meta):
        model = SchemeItem
        fields = BaseSerializer.Meta.fields + [
            'scheme', 'content_type', 'object_id', 'limit_amount', 'copayment_percent'
            ]

        def validate(self, data):
            instance = SchemeItem(**data)
            try:
                instance.full_clean()
            except ValidationError as e:
                raise serializers.ValidationError(e.message_dict)
            return data