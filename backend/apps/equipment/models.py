from django.db import models


class Vendor(models.Model):
    user_id = models.CharField(max_length=255, unique=True)  # Clerk user ID
    company_name = models.CharField(max_length=255, default="My Company")
    email = models.EmailField(blank=True)
    phone = models.CharField(max_length=20, blank=True)
    subscription_active = models.BooleanField(default=False)
    subscription_id = models.CharField(max_length=255, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.company_name} ({self.user_id})"

    class Meta:
        db_table = "vendors"


class EquipmentCategory(models.TextChoices):
    CAMERA = "camera", "Camera & Photography"
    CONSTRUCTION = "construction", "Construction"
    EVENT = "event", "Event Equipment"
    INDUSTRIAL = "industrial", "Industrial Tools"
    AUDIO = "audio", "Audio & Lighting"
    VEHICLES = "vehicles", "Vehicles"
    OTHER = "other", "Other"


class Equipment(models.Model):
    vendor = models.ForeignKey(
        Vendor, on_delete=models.CASCADE, related_name="equipment_list"
    )
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    category = models.CharField(
        max_length=50, choices=EquipmentCategory.choices, default=EquipmentCategory.OTHER
    )
    price_per_day = models.DecimalField(max_digits=10, decimal_places=2)
    deposit_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    quantity = models.IntegerField(default=1)
    image_url = models.URLField(blank=True)
    tags = models.CharField(max_length=255, blank=True)
    specifications = models.JSONField(default=dict, blank=True)
    location = models.CharField(max_length=255, blank=True)
    views_count = models.PositiveIntegerField(default=0)
    booking_count = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} — {self.vendor.company_name}"

    class Meta:
        db_table = "equipment"
        ordering = ["-created_at"]


class Review(models.Model):
    equipment = models.ForeignKey(Equipment, on_delete=models.CASCADE, related_name="reviews")
    user_id = models.CharField(max_length=255)
    rating = models.PositiveSmallIntegerField()
    title = models.CharField(max_length=120, blank=True)
    comment = models.TextField(blank=True)
    vendor_reply = models.TextField(blank=True)
    vendor_reply_updated_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "reviews"
        ordering = ["-created_at"]
        constraints = [
            models.UniqueConstraint(fields=["equipment", "user_id"], name="unique_review_per_user_equipment"),
            models.CheckConstraint(condition=models.Q(rating__gte=1, rating__lte=5), name="review_rating_between_1_5"),
        ]

    def __str__(self):
        return f"Review {self.equipment_id} by {self.user_id}"


class ReviewComment(models.Model):
    review = models.ForeignKey(Review, on_delete=models.CASCADE, related_name="comments")
    user_id = models.CharField(max_length=255)
    parent = models.ForeignKey(
        "self",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="replies",
    )
    comment = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "review_comments"
        ordering = ["created_at"]

    def __str__(self):
        return f"ReviewComment {self.id} by {self.user_id}"


class WishlistItem(models.Model):
    user_id = models.CharField(max_length=255)
    equipment = models.ForeignKey(Equipment, on_delete=models.CASCADE, related_name="wishlisted_by")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "wishlist_items"
        ordering = ["-created_at"]
        constraints = [
            models.UniqueConstraint(fields=["user_id", "equipment"], name="unique_user_equipment_wishlist")
        ]

    def __str__(self):
        return f"{self.user_id} -> {self.equipment_id}"


class CartItem(models.Model):
    user_id = models.CharField(max_length=255)
    equipment = models.ForeignKey(Equipment, on_delete=models.CASCADE, related_name="cart_items")
    quantity = models.PositiveIntegerField(default=1)
    start_date = models.DateField()
    end_date = models.DateField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "cart_items"
        ordering = ["-updated_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["user_id", "equipment", "start_date", "end_date"],
                name="unique_cart_line_per_date_window",
            )
        ]

    def __str__(self):
        return f"CartItem {self.user_id} - {self.equipment_id}"
