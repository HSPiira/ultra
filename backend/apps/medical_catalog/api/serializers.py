
from rest_framework import serializers
from apps.core.utils.serializers import BaseSerializer
from apps.core.utils.sanitizers import sanitize_text
from apps.medical_catalog.models import HospitalItemPrice, LabTest, Medicine, Service
from apps.providers.models import Hospital
from django.contrib.contenttypes.models import ContentType


class ServiceSerializer(BaseSerializer):
    class Meta(BaseSerializer.Meta):
        model = Service
        fields = BaseSerializer.Meta.fields + [
            "name",
            "category",
            "description",
            "base_amount",
            "service_type",
        ]

    def validate_name(self, value):
        """Validate and sanitize service name."""
        sanitized = sanitize_text(value, max_length=255)
        if len(sanitized) < 2:
            raise serializers.ValidationError(
                "Service name must be at least 2 characters long"
            )
        return sanitized

    def validate_category(self, value):
        """Validate and sanitize category."""
        if not value:
            return value
        sanitized = sanitize_text(value, max_length=100)
        if sanitized and len(sanitized) < 2:
            raise serializers.ValidationError(
                "Category must be at least 2 characters long"
            )
        return sanitized

    def validate_description(self, value):
        """Validate and sanitize description."""
        if not value:
            return value
        sanitized = sanitize_text(value, max_length=500, allow_newlines=True)
        return sanitized

    def validate_service_type(self, value):
        """Validate and sanitize service type."""
        if not value:
            return value
        sanitized = sanitize_text(value, max_length=100)
        if sanitized and len(sanitized) < 2:
            raise serializers.ValidationError(
                "Service type must be at least 2 characters long"
            )
        return sanitized


class MedicineSerializer(BaseSerializer):
    class Meta(BaseSerializer.Meta):
        model = Medicine
        fields = BaseSerializer.Meta.fields + [
            "name",
            "dosage_form",
            "unit_price",
            "route",
            "duration",
        ]

    def validate_name(self, value):
        """Validate and sanitize medicine name."""
        sanitized = sanitize_text(value, max_length=255)
        if len(sanitized) < 2:
            raise serializers.ValidationError(
                "Medicine name must be at least 2 characters long"
            )
        return sanitized

    def validate_dosage_form(self, value):
        """Validate and sanitize dosage form."""
        if not value:
            return value
        sanitized = sanitize_text(value, max_length=100)
        if sanitized and len(sanitized) < 2:
            raise serializers.ValidationError(
                "Dosage form must be at least 2 characters long"
            )
        return sanitized

    def validate_route(self, value):
        """Validate and sanitize route."""
        if not value:
            return value
        sanitized = sanitize_text(value, max_length=100)
        if sanitized and len(sanitized) < 2:
            raise serializers.ValidationError(
                "Route must be at least 2 characters long"
            )
        return sanitized

    def validate_duration(self, value):
        """Validate and sanitize duration."""
        if not value:
            return value
        sanitized = sanitize_text(value, max_length=100)
        return sanitized


class LabTestSerializer(BaseSerializer):
    class Meta(BaseSerializer.Meta):
        model = LabTest
        fields = BaseSerializer.Meta.fields + [
            "name",
            "category",
            "description",
            "base_amount",
            "normal_range",
            "units",
        ]

    def validate_name(self, value):
        """Validate and sanitize lab test name."""
        sanitized = sanitize_text(value, max_length=255)
        if len(sanitized) < 2:
            raise serializers.ValidationError(
                "Lab test name must be at least 2 characters long"
            )
        return sanitized

    def validate_category(self, value):
        """Validate and sanitize category."""
        if not value:
            return value
        sanitized = sanitize_text(value, max_length=100)
        if sanitized and len(sanitized) < 2:
            raise serializers.ValidationError(
                "Category must be at least 2 characters long"
            )
        return sanitized

    def validate_description(self, value):
        """Validate and sanitize description."""
        if not value:
            return value
        sanitized = sanitize_text(value, max_length=500, allow_newlines=True)
        return sanitized

    def validate_normal_range(self, value):
        """Validate and sanitize normal range."""
        if not value:
            return value
        sanitized = sanitize_text(value, max_length=255)
        return sanitized

    def validate_units(self, value):
        """Validate and sanitize units."""
        if not value:
            return value
        sanitized = sanitize_text(value, max_length=50)
        if sanitized and len(sanitized) < 1:
            raise serializers.ValidationError("Units must be at least 1 character long")
        return sanitized


class HospitalItemPriceSerializer(BaseSerializer):
    hospital = serializers.PrimaryKeyRelatedField(queryset=Hospital.objects.all())
    content_type = serializers.PrimaryKeyRelatedField(queryset=ContentType.objects.all())

    class Meta(BaseSerializer.Meta):
        model = HospitalItemPrice
        fields = BaseSerializer.Meta.fields + [
            "hospital",
            "content_type",
            "object_id",
            "amount",
            "available",
        ]
