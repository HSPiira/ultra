from rest_framework import serializers
from base.models import *

class CompanyTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = CompanyType
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']

class CompanySerializer(serializers.ModelSerializer):
    class Meta:
        model = Company
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']

class SchemeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Scheme
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']

    def validate(self, data):
        instance = Scheme(**data)
        try:
            instance.full_clean()
        except ValidationError as e:
            raise serializers.ValidationError(e.message_dict)
        return data