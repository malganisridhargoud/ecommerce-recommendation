from rest_framework import serializers
from .models import SubscriptionTier, VendorSubscription
from apps.equipment.models import Vendor


class SubscriptionTierSerializer(serializers.ModelSerializer):
    price_monthly_formatted = serializers.SerializerMethodField()
    
    class Meta:
        model = SubscriptionTier
        fields = [
            'id', 'name', 'slug', 'description', 'price_monthly', 'price_yearly',
            'max_listings', 'max_images_per_listing', 'priority_support',
            'analytics_advanced', 'custom_domain', 'is_active', 'price_monthly_formatted'
        ]
    
    def get_price_monthly_formatted(self, obj):
        return f"₹{obj.price_monthly:,.0f}/mo"


class VendorSubscriptionSerializer(serializers.ModelSerializer):
    tier = SubscriptionTierSerializer(read_only=True)
    vendor_company = serializers.CharField(source='vendor.company_name', read_only=True)
    days_remaining = serializers.SerializerMethodField()
    usage_pct = serializers.SerializerMethodField()
    
    class Meta:
        model = VendorSubscription
        fields = [
            'id', 'tier', 'vendor_company', 'status', 'stripe_subscription_id',
            'current_period_start', 'current_period_end', 'days_remaining',
            'listings_used', 'cancel_at_period_end', 'usage_pct'
        ]
    
    def get_days_remaining(self, obj):
        return obj.days_remaining
    
    def get_usage_pct(self, obj):
        if obj.tier.max_listings == 0:
            return 0
        return min(100, (obj.listings_used / obj.tier.max_listings) * 100)


class UpgradeSubscriptionSerializer(serializers.Serializer):
    tier_slug = serializers.SlugField()
    billing_cycle = serializers.ChoiceField(choices=['monthly', 'yearly'], default='monthly')
    
    def validate_tier_slug(self, value):
        try:
            return SubscriptionTier.objects.get(slug=value, is_active=True)
        except SubscriptionTier.DoesNotExist:
            raise serializers.ValidationError("Invalid or inactive subscription tier.")
    
    def validate(self, data):
        tier = data['tier_slug']
        if tier.price_monthly <= 0:
            raise serializers.ValidationError("Invalid tier pricing")
        return data


class UsageCheckSerializer(serializers.Serializer):
    listings_used = serializers.IntegerField()
    max_listings = serializers.IntegerField()

