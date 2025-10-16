from rest_framework import serializers


class BaseSerializer(serializers.ModelSerializer):
    class Meta:
        fields = ["id", "created_at", "updated_at", "status"]
        read_only_fields = ["id", "created_at", "updated_at"]
