from django.db import models


class UserRole(models.TextChoices):
    BUYER = "buyer", "Buyer"
    VENDOR = "vendor", "Vendor"
    ADMIN = "admin", "Admin"


class UserProfile(models.Model):
    user_id = models.CharField(max_length=255, unique=True)
    role = models.CharField(max_length=20, choices=UserRole.choices, default=UserRole.BUYER)
    email = models.EmailField(blank=True)
    full_name = models.CharField(max_length=255, blank=True)
    phone = models.CharField(max_length=30, blank=True)
    bio = models.TextField(blank=True, default="")
    avatar_url = models.URLField(blank=True, default="")
    preferred_language = models.CharField(max_length=20, default="en")
    preferred_location = models.CharField(max_length=120, blank=True)
    notification_preferences = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "user_profiles"
        ordering = ["-updated_at"]

    def __str__(self):
        return f"{self.user_id} ({self.role})"


class BuyerAddress(models.Model):
    user_id = models.CharField(max_length=255)
    label = models.CharField(max_length=60, default="Home")
    full_name = models.CharField(max_length=255)
    phone = models.CharField(max_length=30)
    line1 = models.CharField(max_length=255)
    line2 = models.CharField(max_length=255, blank=True)
    city = models.CharField(max_length=80)
    state = models.CharField(max_length=80)
    postal_code = models.CharField(max_length=20)
    country = models.CharField(max_length=80, default="India")
    is_default = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "buyer_addresses"
        ordering = ["-is_default", "-updated_at"]

    def __str__(self):
        return f"{self.label} - {self.user_id}"
