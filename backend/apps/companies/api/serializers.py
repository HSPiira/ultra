from rest_framework import serializers

from apps.companies.models import Company, Industry
from apps.core.utils.serializers import BaseSerializer
from apps.core.utils.sanitizers import (
    sanitize_text,
    sanitize_name,
    sanitize_email,
    sanitize_phone_number,
    sanitize_url,
)


class IndustrySerializer(BaseSerializer):
    class Meta(BaseSerializer.Meta):
        model = Industry
        fields = BaseSerializer.Meta.fields + ["industry_name", "description"]

    def validate_industry_name(self, value):
        """Validate and sanitize industry name."""
        sanitized = sanitize_text(value, max_length=100)
        if len(sanitized) < 2:
            raise serializers.ValidationError(
                "Industry name must be at least 2 characters long"
            )
        return sanitized

    def validate_description(self, value):
        """Validate and sanitize description."""
        if not value:
            return value
        sanitized = sanitize_text(value, max_length=500, allow_newlines=True)
        return sanitized


class CompanySerializer(BaseSerializer):
    industry = serializers.PrimaryKeyRelatedField(queryset=Industry.objects.all())
    industry_detail = IndustrySerializer(source="industry", read_only=True)

    class Meta(BaseSerializer.Meta):
        model = Company
        fields = BaseSerializer.Meta.fields + [
            "company_name",
            "company_address",
            "industry",
            "industry_detail",
            "contact_person",
            "email",
            "phone_number",
            "website",
            "remark",
        ]

    def validate_company_name(self, value):
        """Validate and sanitize company name."""
        sanitized = sanitize_name(value)
        if len(sanitized) < 2:
            raise serializers.ValidationError(
                "Company name must be at least 2 characters long"
            )
        if len(sanitized) > 255:
            raise serializers.ValidationError(
                "Company name cannot exceed 255 characters"
            )
        return sanitized

    def validate_email(self, value):
        """Validate and sanitize email format."""
        if not value:
            raise serializers.ValidationError("Email is required")
        sanitized = sanitize_email(value)
        if "@" not in sanitized or "." not in sanitized.split("@")[-1]:
            raise serializers.ValidationError("Enter a valid email address")
        return sanitized

    def validate_phone_number(self, value):
        """Validate and sanitize phone number."""
        if not value:
            raise serializers.ValidationError("Phone number is required")
        sanitized = sanitize_phone_number(value)
        # Remove formatting to check digit count
        clean_phone = sanitized.replace("+", "").replace("-", "").replace(" ", "").replace("(", "").replace(")", "")
        if not clean_phone.isdigit() or len(clean_phone) < 10:
            raise serializers.ValidationError(
                "Enter a valid phone number (at least 10 digits)"
            )
        return sanitized

    def validate_contact_person(self, value):
        """Validate and sanitize contact person name."""
        sanitized = sanitize_name(value)
        if len(sanitized) < 2:
            raise serializers.ValidationError(
                "Contact person name must be at least 2 characters long"
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
