from rest_framework import serializers
from .models import Booking, Dispute
from apps.equipment.serializers import EquipmentSerializer


class BookingSerializer(serializers.ModelSerializer):
    equipment_detail = EquipmentSerializer(source="equipment", read_only=True)

    class Meta:
        model = Booking
        fields = [
            "id", "equipment", "equipment_detail", "user_id",
            "shipping_address", "payment_method", "stripe_payment_intent_id",
            "start_date", "end_date", "total_price", "status", 
            "refund_amount", "refund_status", "refund_processed_at",
            "issue_text", "issue_status",
            "notes", "created_at", "updated_at",
        ]
        read_only_fields = ["id", "user_id", "total_price", "status", "created_at", "updated_at"]


class BookingCreateSerializer(serializers.Serializer):
    equipment_id = serializers.IntegerField()
    start_date = serializers.DateField()
    end_date = serializers.DateField()
    notes = serializers.CharField(required=False, allow_blank=True)
    payment_method = serializers.ChoiceField(choices=["stripe", "cod"], required=False, default="stripe")
    shipping_address = serializers.DictField(required=False)

    def validate(self, attrs):
        if attrs["end_date"] < attrs["start_date"]:
            raise serializers.ValidationError({"end_date": "End date must be on or after start date."})
        return attrs


class DisputeSerializer(serializers.ModelSerializer):
    booking_detail = BookingSerializer(source="booking", read_only=True)

    class Meta:
        model = Dispute
        fields = [
            "id", "booking", "booking_detail", "reason", "description",
            "evidence_url", "status", "admin_response", "resolution",
            "created_at", "updated_at"
        ]
        read_only_fields = ["id", "status", "admin_response", "resolution", "created_at", "updated_at"]
