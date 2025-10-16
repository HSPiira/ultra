from rest_framework import serializers

from apps.core.utils.serializers import BaseSerializer
from apps.providers.models import Doctor, DoctorHospitalAffiliation, Hospital


class HospitalSerializer(BaseSerializer):
    class Meta(BaseSerializer.Meta):
        model = Hospital
        fields = BaseSerializer.Meta.fields + [
            "name",
            "address",
            "branch_of",
            "contact_person",
            "phone_number",
            "email",
            "website",
        ]


class DoctorHospitalAffiliationSerializer(serializers.ModelSerializer):
    hospital_detail = HospitalSerializer(source="hospital", read_only=True)

    class Meta:
        model = DoctorHospitalAffiliation
        fields = [
            "hospital",
            "hospital_detail",
            "role",
            "start_date",
            "end_date",
            "is_primary",
        ]
        extra_kwargs = {
            "hospital": {"required": True},
        }


class DoctorSerializer(BaseSerializer):
    hospital = serializers.PrimaryKeyRelatedField(
        queryset=Hospital.objects.all(), write_only=True, required=False
    )
    hospital_detail = serializers.SerializerMethodField(read_only=True)
    affiliations = DoctorHospitalAffiliationSerializer(
        many=True, source="doctorhospitalaffiliation_set", read_only=True
    )
    affiliations_payload = DoctorHospitalAffiliationSerializer(
        many=True, write_only=True, required=False
    )

    class Meta(BaseSerializer.Meta):
        model = Doctor
        fields = BaseSerializer.Meta.fields + [
            "name",
            "specialization",
            "license_number",
            "qualification",
            "phone_number",
            "email",
            "hospitals",
            "hospital",
            "hospital_detail",
            "affiliations",
            "affiliations_payload",
        ]

    from drf_spectacular.utils import extend_schema_field

    @extend_schema_field(
        {
            "type": "object",
            "nullable": True,
            "properties": {
                "id": {"type": "string"},
                "name": {"type": "string"},
                "email": {"type": "string", "format": "email"},
                "phone_number": {"type": "string"},
            },
        }
    )
    def get_hospital_detail(self, obj):
        hospital = next(iter(obj.hospitals.all()), None)
        if not hospital:
            return None
        return HospitalSerializer(hospital).data
