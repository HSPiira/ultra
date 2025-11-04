from rest_framework import serializers

from apps.core.utils.serializers import BaseSerializer
from apps.core.utils.sanitizers import (
    sanitize_text,
    sanitize_name,
    sanitize_identifier,
    sanitize_email,
    sanitize_phone_number,
)
from apps.members.models import Person
from apps.companies.models import Company
from apps.schemes.models import Scheme
from apps.companies.api.serializers import CompanySerializer
from apps.schemes.api.serializers import SchemeSerializer


class PersonSerializer(BaseSerializer):
    company = serializers.PrimaryKeyRelatedField(queryset=Company.objects.all())
    company_detail = CompanySerializer(source="company", read_only=True)

    scheme = serializers.PrimaryKeyRelatedField(queryset=Scheme.objects.all())
    scheme_detail = SchemeSerializer(source="scheme", read_only=True)

    parent = serializers.PrimaryKeyRelatedField(
        queryset=Person.objects.all(), required=False, allow_null=True
    )
    parent_detail = serializers.SerializerMethodField(read_only=True)

    class Meta(BaseSerializer.Meta):
        model = Person
        fields = BaseSerializer.Meta.fields + [
            "company",
            "scheme",
            "name",
            "national_id",
            "gender",
            "relationship",
            "parent",
            "date_of_birth",
            "card_number",
            "address",
            "phone_number",
            "email",
            "company_detail",
            "scheme_detail",
            "parent_detail",
        ]

    def get_parent_detail(self, obj) -> dict | None:
        """Get parent detail (can't use nested PersonSerializer to avoid circular reference)."""
        if obj.parent:
            return {
                "id": str(obj.parent.id),
                "name": obj.parent.name,
                "card_number": obj.parent.card_number,
            }
        return None

    def validate_name(self, value):
        """Validate and sanitize person name."""
        sanitized = sanitize_name(value)
        if len(sanitized) < 2:
            raise serializers.ValidationError(
                "Name must be at least 2 characters long"
            )
        if len(sanitized) > 255:
            raise serializers.ValidationError("Name cannot exceed 255 characters")
        return sanitized

    def validate_national_id(self, value):
        """Validate and sanitize national ID."""
        if not value:
            return value
        sanitized = sanitize_identifier(value)
        if len(sanitized) < 5:
            raise serializers.ValidationError(
                "National ID must be at least 5 characters long"
            )
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

    def validate(self, attrs):
        relationship = attrs.get(
            "relationship", getattr(self.instance, "relationship", None)
        )
        parent = attrs.get("parent", getattr(self.instance, "parent", None))
        if relationship == "SELF" and parent is not None:
            raise serializers.ValidationError("Principal (SELF) cannot have a parent")
        
        # Validate company is active
        company = attrs.get("company") or (self.instance.company if self.instance else None)
        if company:
            from apps.core.enums.choices import BusinessStatusChoices
            if company.status != BusinessStatusChoices.ACTIVE or company.is_deleted:
                raise serializers.ValidationError("Company must be active to create or update a member")
        
        # Validate scheme is active
        scheme = attrs.get("scheme") or (self.instance.scheme if self.instance else None)
        if scheme:
            from apps.core.enums.choices import BusinessStatusChoices
            if scheme.status != BusinessStatusChoices.ACTIVE or scheme.is_deleted:
                raise serializers.ValidationError("Scheme must be active to create or update a member")
        
        # Validate parent is active (for dependants)
        if parent and relationship != "SELF":
            from apps.core.enums.choices import BusinessStatusChoices
            if parent.status != BusinessStatusChoices.ACTIVE or parent.is_deleted:
                raise serializers.ValidationError("Parent member must be active to create or update a dependant")
        
        return attrs


class BulkPersonRowSerializer(serializers.Serializer):
    member_key = serializers.CharField(required=False)
    parent_key = serializers.CharField(required=False)
    name = serializers.CharField()
    card_number = serializers.CharField()
    gender = serializers.CharField()
    relationship = serializers.CharField()
    national_id = serializers.CharField(required=False, allow_blank=True)
    date_of_birth = serializers.DateField(required=False)
    email = serializers.EmailField(required=False, allow_blank=True)
    phone_number = serializers.CharField(required=False, allow_blank=True)
    address = serializers.CharField(required=False, allow_blank=True)

    def validate_name(self, value):
        """Validate and sanitize person name."""
        sanitized = sanitize_name(value)
        if len(sanitized) < 2:
            raise serializers.ValidationError(
                "Name must be at least 2 characters long"
            )
        if len(sanitized) > 255:
            raise serializers.ValidationError("Name cannot exceed 255 characters")
        return sanitized

    def validate_national_id(self, value):
        """Validate and sanitize national ID."""
        if not value:
            return value
        sanitized = sanitize_identifier(value)
        if len(sanitized) < 5:
            raise serializers.ValidationError(
                "National ID must be at least 5 characters long"
            )
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
