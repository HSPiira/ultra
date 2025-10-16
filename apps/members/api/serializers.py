from rest_framework import serializers

from apps.core.utils.serializers import BaseSerializer
from apps.members.models import Person


class PersonSerializer(BaseSerializer):
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
        ]

    def validate(self, attrs):
        relationship = attrs.get(
            "relationship", getattr(self.instance, "relationship", None)
        )
        parent = attrs.get("parent", getattr(self.instance, "parent", None))
        if relationship == "SELF" and parent is not None:
            raise serializers.ValidationError("Principal (SELF) cannot have a parent")
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
