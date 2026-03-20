from django.db import models
from apps.equipment.models import Equipment


class BookingStatus(models.TextChoices):
    PENDING = "pending", "Pending"
    CONFIRMED = "confirmed", "Confirmed"
    ACTIVE = "active", "Active"
    SHIPPED = "shipped", "Shipped"
    DELIVERED = "delivered", "Delivered"
    COMPLETED = "completed", "Completed"
    CANCELLED = "cancelled", "Cancelled"


class IssueStatus(models.TextChoices):
    OPEN = "open", "Open"
    IN_PROGRESS = "in_progress", "In Progress"
    RESOLVED = "resolved", "Resolved"
    CLOSED = "closed", "Closed"


class Booking(models.Model):
    class PaymentMethod(models.TextChoices):
        STRIPE = "stripe", "Stripe"
        COD = "cod", "Cash on Delivery"

    equipment = models.ForeignKey(
        Equipment, on_delete=models.CASCADE, related_name="bookings"
    )
    user_id = models.CharField(max_length=255)  # Clerk user ID
    shipping_address = models.JSONField(default=dict, blank=True)
    payment_method = models.CharField(
        max_length=20,
        choices=PaymentMethod.choices,
        default=PaymentMethod.STRIPE,
    )
    stripe_payment_intent_id = models.CharField(max_length=255, blank=True, default="")
    start_date = models.DateField()
    end_date = models.DateField()
    total_price = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    status = models.CharField(
        max_length=20, choices=BookingStatus.choices, default=BookingStatus.CONFIRMED
    )
    # Refund-related fields
    refund_amount = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    refund_status = models.CharField(max_length=50, blank=True, default="")
    refund_processed_at = models.DateTimeField(null=True, blank=True)
    # Issue tracking
    issue_text = models.TextField(blank=True, default="")
    issue_status = models.CharField(
        max_length=20, choices=IssueStatus.choices, blank=True, default=""
    )
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Booking #{self.id} — {self.equipment.name} by {self.user_id}"

    class Meta:
        db_table = "bookings"
        ordering = ["-created_at"]


class CartCheckout(models.Model):
    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        PAID = "paid", "Paid"
        FAILED = "failed", "Failed"

    user_id = models.CharField(max_length=255)
    booking_ids = models.JSONField(default=list, blank=True)
    total_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    payment_method = models.CharField(
        max_length=20,
        choices=Booking.PaymentMethod.choices,
        default=Booking.PaymentMethod.STRIPE,
    )
    stripe_payment_intent_id = models.CharField(max_length=255, blank=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "cart_checkouts"
        ordering = ["-created_at"]
