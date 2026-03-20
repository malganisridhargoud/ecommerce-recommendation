from rest_framework import serializers
from .models import ChatMessage, ChatThread


class ChatMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChatMessage
        fields = ["id", "thread", "sender_id", "message", "attachment_url", "created_at"]
        read_only_fields = ["id", "thread", "sender_id", "created_at"]


class ChatThreadSerializer(serializers.ModelSerializer):
    latest_message = serializers.SerializerMethodField()
    equipment_name = serializers.CharField(source="equipment.name", read_only=True)
    equipment_image_url = serializers.CharField(source="equipment.image_url", read_only=True)
    equipment_vendor_name = serializers.CharField(source="equipment.vendor.company_name", read_only=True)

    class Meta:
        model = ChatThread
        fields = [
            "id",
            "equipment",
            "equipment_name",
            "equipment_image_url",
            "equipment_vendor_name",
            "buyer_id",
            "vendor_id",
            "created_at",
            "updated_at",
            "latest_message",
        ]
        read_only_fields = ["id", "buyer_id", "vendor_id", "created_at", "updated_at"]

    def get_latest_message(self, obj):
        msg = obj.messages.order_by("-created_at").first()
        if not msg:
            return None
        return ChatMessageSerializer(msg).data
