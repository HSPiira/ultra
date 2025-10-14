from rest_framework import serializers

from apps.core.utils.serializers import BaseSerializer
from apps.medical_catalog.models import Service, Medicine, LabTest, HospitalItemPrice


class ServiceSerializer(BaseSerializer):
    class Meta(BaseSerializer.Meta):
        model = Service
        fields = BaseSerializer.Meta.fields + [
            'name', 'category', 'description', 'base_amount', 'service_type'
        ]


class MedicineSerializer(BaseSerializer):
    class Meta(BaseSerializer.Meta):
        model = Medicine
        fields = BaseSerializer.Meta.fields + [
            'name', 'dosage_form', 'unit_price', 'route', 'duration'
        ]


class LabTestSerializer(BaseSerializer):
    class Meta(BaseSerializer.Meta):
        model = LabTest
        fields = BaseSerializer.Meta.fields + [
            'name', 'category', 'description', 'base_amount', 'normal_range', 'units'
        ]


class HospitalItemPriceSerializer(BaseSerializer):
    class Meta(BaseSerializer.Meta):
        model = HospitalItemPrice
        fields = BaseSerializer.Meta.fields + [
            'hospital', 'content_type', 'object_id', 'amount', 'available'
        ]


