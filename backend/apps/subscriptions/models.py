from django.db import models
from decimal import Decimal


class SubscriptionTier(models.Model):
    name = models.CharField(max_length=50, unique=True)
    slug = models.SlugField(max_length=50, unique=True)
    price_monthly = models.DecimalField(max_digits=10, decimal_places=2)
    price_yearly = models.DecimalField(max_digits=10, decimal_places=2)
    description = models.TextField()
    
    # Feature limits
    max_listings = models.PositiveIntegerField(default=0)  # 0 = unlimited
    max_images_per_listing = models.PositiveIntegerField(default=10)
    priority_support = models.BooleanField(default=False)
    analytics_advanced = models.BooleanField(default=False)
    custom_domain = models.BooleanField(default=False)
    
    is_active = models.BooleanField(default=True)
    order = models.PositiveIntegerField(default=0)
    
    class Meta:
        ordering = ['order']
        db_table = 'subscription_tiers'
    
    def __str__(self):
        return self.name


class VendorSubscription(models.Model):
    STATUS_CHOICES = [
        ('trialing', 'Trialing'),
        ('active', 'Active'),
        ('past_due', 'Past Due'),
        ('canceled', 'Canceled'),
        ('unpaid', 'Unpaid'),
    ]
    
    vendor = models.OneToOneField("equipment.Vendor", on_delete=models.CASCADE, related_name='subscription')
    tier = models.ForeignKey(SubscriptionTier, on_delete=models.PROTECT)
    stripe_subscription_id = models.CharField(max_length=255, blank=True)
    stripe_customer_id = models.CharField(max_length=255, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='trialing')
    
    current_period_start = models.DateTimeField(null=True, blank=True)
    current_period_end = models.DateTimeField(null=True, blank=True)
    cancel_at_period_end = models.BooleanField(default=False)
    canceled_at = models.DateTimeField(null=True, blank=True)
    
    listings_used = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    @property
    def is_active(self):
        return self.status == 'active' and not self.cancel_at_period_end
    
    @property
    def days_remaining(self):
        from django.utils import timezone
        if not self.current_period_end:
            return None
        return max(0, (self.current_period_end - timezone.now()).days)
    
    def can_create_listing(self):
        if self.tier.max_listings == 0:
            return True
        return self.listings_used < self.tier.max_listings

    @property
    def usage_pct(self):
        if self.tier.max_listings == 0:
            return 0
        return min(100, int((self.listings_used / self.tier.max_listings) * 100))
    
    class Meta:
        db_table = 'vendor_subscriptions'

    def __str__(self):
        return f"{self.vendor.company_name} - {self.tier.name} ({self.status})"

