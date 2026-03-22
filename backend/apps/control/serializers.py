from rest_framework import serializers
from apps.vendors.models import VendorKYC
from apps.equipment.models import Vendor, Equipment
from apps.equipment.serializers import VendorSerializer

class VendorKYCSerializer(serializers.ModelSerializer):
    class Meta:
        model = VendorKYC
        fields = [
            'status', 'document_type', 'document_url', 'documents_verified', 'id_verified',
            'rejection_reason', 'verified_at', 'created_at'
        ]
        read_only_fields = ['created_at', 'verified_at']

class VendorListSerializer(VendorSerializer):
    kyc_status = serializers.CharField(source='kyc_status', read_only=True)
    kyc = VendorKYCSerializer(source='kyc', read_only=True)
    document_type = serializers.CharField(source='kyc.document_type', read_only=True, default='')
    document_url = serializers.CharField(source='kyc.document_url', read_only=True, default='')
    vendor_name = serializers.CharField(source='company_name', read_only=True)
    vendor = serializers.IntegerField(source='id', read_only=True)

    class Meta(VendorSerializer.Meta):
        fields = VendorSerializer.Meta.fields + ['kyc_status', 'kyc', 'document_type', 'document_url', 'vendor_name', 'vendor']

class EquipmentModerationSerializer(serializers.ModelSerializer):
    vendor_name = serializers.CharField(source="vendor.company_name", read_only=True)
    category_display = serializers.CharField(source="get_category_display", read_only=True)

    class Meta:
        model = Equipment
        fields = [
            "id", "name", "description", "category", "category_display", "price_per_day", "deposit_amount",
            "quantity", "image_url", "tags", "location", "moderation_status", "moderation_notes",
            "vendor_name", "created_at"
        ]
        read_only_fields = ["id", "name", "description", "category", "price_per_day", "deposit_amount",
                            "quantity", "image_url", "tags", "location", "vendor_name", "created_at"]

