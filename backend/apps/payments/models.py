from django.db import models
from apps.bookings.models import Booking
from apps.equipment.models import Vendor


class Payment(models.Model):
    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        SUCCEEDED = "succeeded", "Succeeded"
        FAILED = "failed", "Failed"
        REFUNDED = "refunded", "Refunded"

    booking = models.OneToOneField(
        Booking, on_delete=models.CASCADE, related_name="payment"
    )
    stripe_payment_intent_id = models.CharField(max_length=255, unique=True)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    currency = models.CharField(max_length=3, default="inr")
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Payment #{self.id} — {self.stripe_payment_intent_id}"

    class Meta:
        db_table = "payments"


class VendorBankAccount(models.Model):
    """Track Stripe Connected Accounts for vendors"""
    class VerificationStatus(models.TextChoices):
        UNVERIFIED = "unverified", "Unverified"
        PENDING = "pending", "Pending Verification"
        VERIFIED = "verified", "Verified"
        REJECTED = "rejected", "Rejected"

    vendor = models.OneToOneField(
        Vendor, on_delete=models.CASCADE, related_name="bank_account"
    )
    stripe_connect_account_id = models.CharField(max_length=255, unique=True)
    verification_status = models.CharField(
        max_length=20, choices=VerificationStatus.choices, default=VerificationStatus.UNVERIFIED
    )
    account_holder_name = models.CharField(max_length=255, blank=True)
    account_type = models.CharField(max_length=20, choices=[("individual", "Individual"), ("business", "Business")], default="individual")
    verification_requirements = models.JSONField(default=dict, blank=True)  # Stores Stripe verification data
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.vendor.company_name} — {self.stripe_connect_account_id}"

    class Meta:
        db_table = "vendor_bank_accounts"


class Payout(models.Model):
    """Track vendor payouts"""
    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        IN_PROGRESS = "in_progress", "In Progress"
        COMPLETED = "completed", "Completed"
        FAILED = "failed", "Failed"
        CANCELLED = "cancelled", "Cancelled"

    vendor = models.ForeignKey(
        Vendor, on_delete=models.CASCADE, related_name="payouts"
    )
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    currency = models.CharField(max_length=3, default="inr")
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    stripe_payout_id = models.CharField(max_length=255, blank=True, unique=True, null=True)
    period_start = models.DateField()
    period_end = models.DateField()
    booking_count = models.PositiveIntegerField(default=0)
    commission_percentage = models.DecimalField(max_digits=5, decimal_places=2, default=10)  # Platform commission
    commission_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    net_amount = models.DecimalField(max_digits=12, decimal_places=2)  # amount - commission
    initiated_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    failure_reason = models.TextField(blank=True)
    notes = models.TextField(blank=True)

    def __str__(self):
        return f"Payout #{self.id} — {self.vendor.company_name} ({self.status})"

    class Meta:
        db_table = "payouts"
        ordering = ["-initiated_at"]
