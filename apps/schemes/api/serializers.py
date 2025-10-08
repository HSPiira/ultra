from rest_framework import serializers
from apps.schemes.models.scheme import Scheme
from apps.core.utils.serializers import BaseSerializer
from django.core.exceptions import ValidationError

class SchemeSerializer(BaseSerializer):
    class Meta(BaseSerializer.Meta):
        model = Scheme
        fields = BaseSerializer.Meta.fields + ['scheme_name', 'company', 'description', 'card_code', 'start_date', 'end_date', 'termination_date', 'limit_amount', 'family_applicable', 'remark']

    def validate(self, data):
        instance = Scheme(**data)
        try:
            instance.full_clean()
        except ValidationError as e:
            raise serializers.ValidationError(e.message_dict)
        return data