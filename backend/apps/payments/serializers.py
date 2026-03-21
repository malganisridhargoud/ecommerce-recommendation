from rest_framework import serializers
from .models import Payment, VendorBankAccount, Payout
from apps.equipment.models import Vendor


class PaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = '__all__'


class VendorBankAccountSerializer(serializers.ModelSerializer):
    class Meta:
        model = VendorBankAccount
        fields = '__all__'


class PayoutSerializer(serializers.ModelSerializer):
    vendor_company = serializers.CharField(source='vendor.company_name', read_only=True)
    net_payout = serializers.SerializerMethodField()
    
    class Meta:
        model = Payout
        fields = [
            'id', 'vendor', 'vendor_company', 'amount', 'currency', 'status',
            'stripe_payout_id', 'period_start', 'period_end', 'booking_count',
            'commission_percentage', 'commission_amount', 'net_amount', 'net_payout',
            'initiated_at', 'completed_at', 'failure_reason', 'notes'
        ]
    
    def get_net_payout(self, obj):
        return obj.net_amount

