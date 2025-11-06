from drf_spectacular.utils import extend_schema_field
from rest_framework import serializers

from apps.core.utils.serializers import BaseSerializer
from apps.core.utils.sanitizers import sanitize_text, sanitize_card_code
from apps.schemes.models import Benefit, Plan, Scheme, SchemePeriod, SchemeItem
from apps.companies.models import Company
from apps.companies.api.serializers import CompanySerializer


class SchemeSerializer(BaseSerializer):
    company = serializers.PrimaryKeyRelatedField(queryset=Company.objects.all())
    company_detail = CompanySerializer(source="company", read_only=True)
    current_period = serializers.SerializerMethodField(read_only=True)
    total_periods = serializers.SerializerMethodField(read_only=True)

    class Meta(BaseSerializer.Meta):
        model = Scheme
        fields = BaseSerializer.Meta.fields + [
            "scheme_name",
            "company",
            "company_detail",
            "description",
            "card_code",
            "is_renewable",
            "family_applicable",
            "remark",
            "current_period",
            "total_periods",
        ]

    def get_current_period(self, obj):
        """Get current period summary."""
        current = obj.get_current_period()
        if current:
            return {
                "id": current.id,
                "period_number": current.period_number,
                "start_date": current.start_date,
                "end_date": current.end_date,
                "limit_amount": str(current.limit_amount),
                "is_current": current.is_current,
            }
        return None

    def get_total_periods(self, obj):
        """Get total number of periods."""
        return obj.periods.filter(is_deleted=False).count()

    def validate_scheme_name(self, value):
        """Validate and sanitize scheme name."""
        sanitized = sanitize_text(value, max_length=255)
        if len(sanitized) < 2:
            raise serializers.ValidationError(
                "Scheme name must be at least 2 characters long"
            )
        return sanitized

    def validate_card_code(self, value):
        """Validate and sanitize card code."""
        sanitized = sanitize_card_code(value)
        if len(sanitized) != 3:
            raise serializers.ValidationError("Card code must be exactly 3 characters")
        return sanitized

    def validate_description(self, value):
        """Validate and sanitize description."""
        if not value:
            return value
        sanitized = sanitize_text(value, max_length=500, allow_newlines=True)
        return sanitized

    def validate_company(self, value):
        """Validate company is active."""
        from apps.core.enums.choices import BusinessStatusChoices

        if value.status != BusinessStatusChoices.ACTIVE or value.is_deleted:
            raise serializers.ValidationError("Company must be active to create or update a scheme")

        return value


class PlanSerializer(BaseSerializer):
    class Meta(BaseSerializer.Meta):
        model = Plan
        fields = BaseSerializer.Meta.fields + ["plan_name", "description"]

    def validate_plan_name(self, value):
        """Validate and sanitize plan name."""
        sanitized = sanitize_text(value, max_length=255)
        if len(sanitized) < 2:
            raise serializers.ValidationError(
                "Plan name must be at least 2 characters long"
            )
        return sanitized

    def validate_description(self, value):
        """Validate and sanitize description."""
        if not value:
            return value
        sanitized = sanitize_text(value, max_length=500, allow_newlines=True)
        return sanitized


class BenefitSerializer(BaseSerializer):
    plan = serializers.PrimaryKeyRelatedField(
        queryset=Plan.objects.all(), required=False, allow_null=True
    )
    plan_detail = PlanSerializer(source="plan", read_only=True)

    class Meta(BaseSerializer.Meta):
        model = Benefit
        fields = BaseSerializer.Meta.fields + [
            "benefit_name",
            "description",
            "in_or_out_patient",
            "limit_amount",
            "plan",
            "plan_detail",
        ]

    def validate_benefit_name(self, value):
        """Validate and sanitize benefit name."""
        sanitized = sanitize_text(value, max_length=255)
        if len(sanitized) < 2:
            raise serializers.ValidationError(
                "Benefit name must be at least 2 characters long"
            )
        return sanitized

    def validate_description(self, value):
        """Validate and sanitize description."""
        if not value:
            return value
        sanitized = sanitize_text(value, max_length=500, allow_newlines=True)
        return sanitized

    def validate_in_or_out_patient(self, value):
        """Validate patient type."""
        valid_choices = ["INPATIENT", "OUTPATIENT", "BOTH"]
        if value not in valid_choices:
            raise serializers.ValidationError(
                f"Invalid patient type. Must be one of: {', '.join(valid_choices)}"
            )
        return value

    def validate_limit_amount(self, value):
        """Validate limit amount."""
        if value is not None and value < 0:
            raise serializers.ValidationError("Limit amount cannot be negative")
        return value


class SchemeItemSerializer(BaseSerializer):
    scheme_period = serializers.PrimaryKeyRelatedField(queryset=SchemePeriod.objects.all())
    scheme_period_detail = serializers.SerializerMethodField(read_only=True)
    item_detail = serializers.SerializerMethodField(read_only=True)

    class Meta(BaseSerializer.Meta):
        model = SchemeItem
        fields = BaseSerializer.Meta.fields + [
            "scheme_period",
            "scheme_period_detail",
            "content_type",
            "object_id",
            "item_detail",
            "limit_amount",
            "copayment_percent",
        ]

    def get_scheme_period_detail(self, obj):
        """Get scheme period summary."""
        if obj.scheme_period:
            return {
                "id": obj.scheme_period.id,
                "scheme_name": obj.scheme_period.scheme.scheme_name,
                "period_number": obj.scheme_period.period_number,
                "start_date": obj.scheme_period.start_date,
                "end_date": obj.scheme_period.end_date,
            }
        return None

    def get_item_detail(self, obj) -> dict | None:
        """Get generic item detail (can't use nested serializer for generic FK)."""
        if obj.item:
            return {
                "id": obj.item.id,
                "name": str(obj.item),
                "type": obj.content_type.model if obj.content_type else None,
                "app_label": obj.content_type.app_label if obj.content_type else None,
            }
        return None

    def validate_limit_amount(self, value):
        """Validate limit amount."""
        if value is not None and value < 0:
            raise serializers.ValidationError("Limit amount cannot be negative")
        return value

    def validate_copayment_percent(self, value):
        """Validate copayment percentage."""
        if value is not None:
            if value < 0:
                raise serializers.ValidationError(
                    "Copayment percentage cannot be negative"
                )
            if value > 100:
                raise serializers.ValidationError(
                    "Copayment percentage cannot exceed 100"
                )
        return value


class BulkSchemeItemSerializer(serializers.Serializer):
    """Serializer for bulk scheme item operations."""
    
    scheme_id = serializers.CharField(required=True)
    assignments = serializers.ListField(
        child=serializers.DictField(),
        required=True,
        allow_empty=False
    )

    def validate_assignments(self, value):
        """Validate assignment data."""
        if not value:
            raise serializers.ValidationError("Assignments list cannot be empty")
        
        for i, assignment in enumerate(value):
            required_fields = ["content_type", "object_id"]
            for field in required_fields:
                if not assignment.get(field):
                    raise serializers.ValidationError(
                        f"Assignment {i+1}: {field} is required"
                    )
            
            # Validate limit amount
            limit_amount = assignment.get("limit_amount")
            if limit_amount is not None and limit_amount < 0:
                raise serializers.ValidationError(
                    f"Assignment {i+1}: Limit amount cannot be negative"
                )
            
            # Validate copayment percentage
            copayment = assignment.get("copayment_percent")
            if copayment is not None:
                if copayment < 0:
                    raise serializers.ValidationError(
                        f"Assignment {i+1}: Copayment percentage cannot be negative"
                    )
                if copayment > 100:
                    raise serializers.ValidationError(
                        f"Assignment {i+1}: Copayment percentage cannot exceed 100"
                    )
        
        return value


class BulkAssignmentSerializer(serializers.Serializer):
    """Serializer for bulk assignment operations."""
    
    scheme_id = serializers.UUIDField(required=True)
    assignments = serializers.ListField(
        child=serializers.DictField(),
        required=True,
        allow_empty=False
    )
    
    def validate_assignments(self, value):
        """Validate assignments list structure."""
        if not isinstance(value, list):
            raise serializers.ValidationError("Assignments must be a list")
        
        if len(value) == 0:
            raise serializers.ValidationError("Assignments list cannot be empty")
        
        # Validate each assignment has required fields
        for i, assignment in enumerate(value):
            if not isinstance(assignment, dict):
                raise serializers.ValidationError(f"Assignment {i+1} must be a dictionary")
            
            required_fields = ['content_type_id', 'object_id']
            for field in required_fields:
                if field not in assignment:
                    raise serializers.ValidationError(f"Assignment {i+1} missing required field: {field}")
        
        return value



# Scheme Period Serializers
class SchemePeriodSerializer(BaseSerializer):
    scheme = serializers.PrimaryKeyRelatedField(queryset=Scheme.objects.all())
    scheme_detail = serializers.SerializerMethodField(read_only=True)
    renewed_from = serializers.PrimaryKeyRelatedField(
        queryset=SchemePeriod.objects.all(), required=False, allow_null=True
    )
    items_count = serializers.SerializerMethodField(read_only=True)

    class Meta(BaseSerializer.Meta):
        model = SchemePeriod
        fields = BaseSerializer.Meta.fields + [
            "scheme",
            "scheme_detail",
            "period_number",
            "start_date",
            "end_date",
            "termination_date",
            "limit_amount",
            "renewed_from",
            "renewal_date",
            "is_current",
            "changes_summary",
            "remark",
            "items_count",
        ]

    def get_scheme_detail(self, obj):
        """Get scheme summary."""
        return {
            "id": obj.scheme.id,
            "scheme_name": obj.scheme.scheme_name,
            "card_code": obj.scheme.card_code,
            "company_name": obj.scheme.company.company_name if obj.scheme.company else None,
        }

    def get_items_count(self, obj):
        """Get count of items for this period."""
        return obj.items.filter(is_deleted=False).count()

    def validate(self, data):
        """Cross-field validation."""
        start_date = data.get("start_date")
        end_date = data.get("end_date")
        termination_date = data.get("termination_date")

        if start_date and end_date and start_date >= end_date:
            raise serializers.ValidationError("End date must be after start date")

        if termination_date and end_date and termination_date <= end_date:
            raise serializers.ValidationError("Termination date must be after end date")

        return data


class SchemeRenewalSerializer(serializers.Serializer):
    """Serializer for scheme renewal requests."""
    start_date = serializers.DateField(required=True)
    end_date = serializers.DateField(required=True)
    limit_amount = serializers.DecimalField(max_digits=15, decimal_places=2, required=False)
    remark = serializers.CharField(max_length=500, required=False, allow_blank=True)
    copy_items = serializers.BooleanField(default=True)
    item_modifications = serializers.JSONField(required=False, allow_null=True)

    def validate(self, data):
        """Cross-field validation."""
        if data["start_date"] >= data["end_date"]:
            raise serializers.ValidationError("End date must be after start date")
        return data

