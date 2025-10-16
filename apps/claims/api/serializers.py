from rest_framework import serializers

from apps.claims.models import Claim, ClaimDetail, ClaimPayment
from apps.core.utils.serializers import BaseSerializer
from apps.members.models import Person
from apps.providers.api.serializers import DoctorSerializer, HospitalSerializer
from apps.providers.models import Doctor, Hospital


class ClaimDetailSerializer(BaseSerializer):
    class Meta(BaseSerializer.Meta):
        model = ClaimDetail
        fields = BaseSerializer.Meta.fields + [
            "claim",
            "item_description",
            "quantity",
            "unit_price",
            "total_amount",
        ]
        extra_kwargs = {"claim": {"write_only": True, "required": False}}


class ClaimPaymentSerializer(BaseSerializer):
    class Meta(BaseSerializer.Meta):
        model = ClaimPayment
        fields = BaseSerializer.Meta.fields + ["claim", "method", "reference"]
        extra_kwargs = {"claim": {"write_only": True, "required": False}}


class ClaimSerializer(BaseSerializer):
    member = serializers.PrimaryKeyRelatedField(queryset=Person.objects.all())
    hospital = serializers.PrimaryKeyRelatedField(queryset=Hospital.objects.all())
    doctor = serializers.PrimaryKeyRelatedField(
        queryset=Doctor.objects.all(), allow_null=True, required=False
    )

    hospital_detail = HospitalSerializer(source="hospital", read_only=True)
    doctor_detail = DoctorSerializer(source="doctor", read_only=True)

    details = ClaimDetailSerializer(many=True, required=False)
    payments = ClaimPaymentSerializer(many=True, required=False)

    class Meta(BaseSerializer.Meta):
        model = Claim
        fields = BaseSerializer.Meta.fields + [
            "member",
            "hospital",
            "doctor",
            "service_date",
            "claim_status",
            "invoice_number",
            "hospital_detail",
            "doctor_detail",
            "details",
            "payments",
        ]
