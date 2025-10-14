from rest_framework import serializers

from apps.core.utils.serializers import BaseSerializer
from apps.providers.models import Hospital, Doctor


class HospitalSerializer(BaseSerializer):
    class Meta(BaseSerializer.Meta):
        model = Hospital
        fields = BaseSerializer.Meta.fields + [
            'name', 'address', 'branch_of', 'contact_person', 'phone_number', 'email', 'website'
        ]


class DoctorSerializer(BaseSerializer):
    hospital_detail = HospitalSerializer(source='hospital', read_only=True)

    class Meta(BaseSerializer.Meta):
        model = Doctor
        fields = BaseSerializer.Meta.fields + [
            'hospital', 'hospital_detail', 'name', 'specialization', 'license_number',
            'qualification', 'phone_number', 'email'
        ]


