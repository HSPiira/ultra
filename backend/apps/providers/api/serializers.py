from rest_framework import serializers
from drf_spectacular.utils import extend_schema_field

from apps.core.utils.serializers import BaseSerializer
from apps.core.utils.sanitizers import (
    sanitize_text,
    sanitize_name,
    sanitize_identifier,
    sanitize_email,
    sanitize_phone_number,
    sanitize_url,
)
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

    def validate_name(self, value):
        """Validate and sanitize hospital name."""
        sanitized = sanitize_name(value)
        if len(sanitized) < 2:
            raise serializers.ValidationError(
                "Hospital name must be at least 2 characters long"
            )
        if len(sanitized) > 255:
            raise serializers.ValidationError("Hospital name cannot exceed 255 characters")
        return sanitized

    def validate_address(self, value):
        """Validate and sanitize address."""
        if not value:
            return value
        sanitized = sanitize_text(value, max_length=500)
        if sanitized and len(sanitized) < 5:
            raise serializers.ValidationError(
                "Address must be at least 5 characters long"
            )
        return sanitized

    def validate_contact_person(self, value):
        """Validate and sanitize contact person name."""
        if not value:
            return value
        sanitized = sanitize_name(value)
        if sanitized and len(sanitized) < 2:
            raise serializers.ValidationError(
                "Contact person name must be at least 2 characters long"
            )
        return sanitized

    def validate_email(self, value):
        """Validate and sanitize email format."""
        if not value:
            return value
        sanitized = sanitize_email(value)
        if sanitized and ("@" not in sanitized or "." not in sanitized.split("@")[-1]):
            raise serializers.ValidationError("Enter a valid email address")
        return sanitized

    def validate_phone_number(self, value):
        """Validate and sanitize phone number."""
        if not value:
            return value
        sanitized = sanitize_phone_number(value)
        # Remove formatting to check digit count
        clean_phone = (
            sanitized.replace("+", "")
            .replace("-", "")
            .replace(" ", "")
            .replace("(", "")
            .replace(")", "")
        )
        if sanitized and (not clean_phone.isdigit() or len(clean_phone) < 10):
            raise serializers.ValidationError(
                "Enter a valid phone number (at least 10 digits)"
            )
        return sanitized

    def validate_website(self, value):
        """Validate and sanitize website URL."""
        if not value:
            return value
        sanitized = sanitize_url(value)
        if sanitized and not sanitized.startswith(("http://", "https://")):
            sanitized = "https://" + sanitized
        return sanitized


class DoctorHospitalAffiliationSerializer(serializers.ModelSerializer):
    hospital_detail = HospitalSerializer(source="hospital", read_only=True)
    hospital = serializers.PrimaryKeyRelatedField(queryset=Hospital.objects.all(), write_only=True, required=False)

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

    def validate_role(self, value):
        """Validate and sanitize role description."""
        if not value:
            return value
        sanitized = sanitize_text(value, max_length=255)
        if sanitized and len(sanitized) < 2:
            raise serializers.ValidationError(
                "Role must be at least 2 characters long"
            )
        return sanitized


class DoctorSerializer(BaseSerializer):
    hospitals = serializers.SerializerMethodField(read_only=True)
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

    @extend_schema_field({"type": "string", "nullable": True})
    def get_hospital(self, obj):
        return getattr(obj, "hospital_id", None)

    @extend_schema_field({"type": "array", "items": {"type": "string"}})
    def get_hospitals(self, obj):
        return list(obj.hospitals.values_list("id", flat=True))

    def validate_name(self, value):
        """Validate and sanitize doctor name."""
        sanitized = sanitize_name(value)
        if len(sanitized) < 2:
            raise serializers.ValidationError(
                "Doctor name must be at least 2 characters long"
            )
        if len(sanitized) > 255:
            raise serializers.ValidationError("Doctor name cannot exceed 255 characters")
        return sanitized

    def validate_specialization(self, value):
        """Validate and sanitize specialization."""
        if not value:
            return value
        sanitized = sanitize_text(value, max_length=255)
        if sanitized and len(sanitized) < 2:
            raise serializers.ValidationError(
                "Specialization must be at least 2 characters long"
            )
        return sanitized

    def validate_license_number(self, value):
        """Validate and sanitize license number."""
        if not value:
            return value
        sanitized = sanitize_identifier(value)
        if sanitized and len(sanitized) < 3:
            raise serializers.ValidationError(
                "License number must be at least 3 characters long"
            )
        return sanitized

    def validate_qualification(self, value):
        """Validate and sanitize qualification."""
        if not value:
            return value
        sanitized = sanitize_text(value, max_length=500)
        if sanitized and len(sanitized) < 2:
            raise serializers.ValidationError(
                "Qualification must be at least 2 characters long"
            )
        return sanitized

    def validate_email(self, value):
        """Validate and sanitize email format."""
        if not value:
            return value
        sanitized = sanitize_email(value)
        if sanitized and ("@" not in sanitized or "." not in sanitized.split("@")[-1]):
            raise serializers.ValidationError("Enter a valid email address")
        return sanitized

    def validate_phone_number(self, value):
        """Validate and sanitize phone number."""
        if not value:
            return value
        sanitized = sanitize_phone_number(value)
        # Remove formatting to check digit count
        clean_phone = (
            sanitized.replace("+", "")
            .replace("-", "")
            .replace(" ", "")
            .replace("(", "")
            .replace(")", "")
        )
        if sanitized and (not clean_phone.isdigit() or len(clean_phone) < 10):
            raise serializers.ValidationError(
                "Enter a valid phone number (at least 10 digits)"
            )
        return sanitized
