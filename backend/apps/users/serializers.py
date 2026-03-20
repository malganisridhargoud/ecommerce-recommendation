from rest_framework import serializers
from .models import UserProfile, UserRole, BuyerAddress


class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = [
            "user_id",
            "role",
            "email",
            "full_name",
            "phone",
            "bio",
            "avatar_url",
            "preferred_language",
            "preferred_location",
            "notification_preferences",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["user_id", "created_at", "updated_at"]


class UpdateRoleSerializer(serializers.Serializer):
    role = serializers.ChoiceField(choices=UserRole.choices)
    full_name = serializers.CharField(max_length=255, required=False, allow_blank=True)
    phone = serializers.CharField(max_length=30, required=False, allow_blank=True)
    company_name = serializers.CharField(max_length=255, required=False, allow_blank=True)


class BuyerAddressSerializer(serializers.ModelSerializer):
    class Meta:
        model = BuyerAddress
        fields = [
            "id",
            "user_id",
            "label",
            "full_name",
            "phone",
            "line1",
            "line2",
            "city",
            "state",
            "postal_code",
            "country",
            "is_default",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "user_id", "created_at", "updated_at"]
