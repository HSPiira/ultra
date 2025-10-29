from rest_framework import serializers

from apps.core.utils.serializers import BaseSerializer
from apps.members.models import Person


class PersonSerializer(BaseSerializer):
    company_detail = serializers.SerializerMethodField()
    scheme_detail = serializers.SerializerMethodField()
    parent_detail = serializers.SerializerMethodField()

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

    def get_company_detail(self, obj) -> dict | None:
        if obj.company:
            return {
                "id": str(obj.company.id),
                "company_name": obj.company.company_name,
            }
        return None

    def get_scheme_detail(self, obj) -> dict | None:
        if obj.scheme:
            return {
                "id": str(obj.scheme.id),
                "scheme_name": obj.scheme.scheme_name,
            }
        return None

    def get_parent_detail(self, obj) -> dict | None:
        if obj.parent:
            return {
                "id": str(obj.parent.id),
                "name": obj.parent.name,
            }
        return None

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
