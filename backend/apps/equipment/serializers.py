from rest_framework import serializers
from django.db.models import Avg, Count
from .models import Equipment, Vendor, Review, ReviewComment, WishlistItem, CartItem


class VendorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Vendor
        fields = ["id", "user_id", "company_name", "email", "phone", "subscription_active", "kyc_status", "created_at"]
        read_only_fields = ["id", "user_id", "subscription_active", "kyc_status", "created_at"]


class EquipmentSerializer(serializers.ModelSerializer):
    vendor_name = serializers.CharField(source="vendor.company_name", read_only=True)
    average_rating = serializers.SerializerMethodField()
    review_count = serializers.SerializerMethodField()
    is_wishlisted = serializers.SerializerMethodField()
    vendor_active_listing_count = serializers.SerializerMethodField()
    is_available = serializers.SerializerMethodField()

    class Meta:
        model = Equipment
        fields = [
            "id", "vendor", "vendor_name", "name", "description", "category",
            "price_per_day", "deposit_amount", "quantity", "image_url", "tags", "specifications",
            "location", "views_count", "booking_count", "is_active", "created_at",
            "average_rating", "review_count", "is_wishlisted", "vendor_active_listing_count", "is_available",
        ]
        read_only_fields = ["id", "vendor", "created_at"]

    def get_average_rating(self, obj):
        value = obj.reviews.aggregate(avg=Avg("rating"))["avg"]
        return round(float(value), 2) if value else 0

    def get_review_count(self, obj):
        return obj.reviews.aggregate(total=Count("id"))["total"] or 0

    def get_is_wishlisted(self, obj):
        request = self.context.get("request")
        if not request or not request.user or not request.user.is_authenticated:
            return False
        return WishlistItem.objects.filter(user_id=request.user.id, equipment=obj).exists()

    def get_vendor_active_listing_count(self, obj):
        return obj.vendor.equipment_list.filter(is_active=True).count()

    def get_is_available(self, obj):
        return bool(obj.is_active and int(obj.quantity or 0) > 0 and self.get_vendor_active_listing_count(obj) > 0)


class EquipmentCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Equipment
        fields = [
            "name",
            "description",
            "category",
            "price_per_day",
            "deposit_amount",
            "quantity",
            "image_url",
            "tags",
            "specifications",
            "location",
        ]


class ReviewCommentSerializer(serializers.ModelSerializer):
    commenter_name = serializers.SerializerMethodField()

    class Meta:
        model = ReviewComment
        fields = [
            "id",
            "review",
            "user_id",
            "commenter_name",
            "parent",
            "comment",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "review", "user_id", "commenter_name", "created_at", "updated_at"]

    def get_commenter_name(self, obj):
        from apps.users.models import UserProfile

        profile = UserProfile.objects.filter(user_id=obj.user_id).only("full_name").first()
        return profile.full_name if profile and profile.full_name else "User"


class ReviewSerializer(serializers.ModelSerializer):
    reviewer_name = serializers.SerializerMethodField()
    equipment_detail = EquipmentSerializer(source="equipment", read_only=True)
    comments = serializers.SerializerMethodField()

    class Meta:
        model = Review
        fields = [
            "id",
            "equipment",
            "equipment_detail",
            "user_id",
            "reviewer_name",
            "rating",
            "title",
            "comment",
            "vendor_reply",
            "vendor_reply_updated_at",
            "comments",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "equipment", "user_id", "reviewer_name", "created_at", "updated_at", "vendor_reply_updated_at"]

    def get_reviewer_name(self, obj):
        from apps.users.models import UserProfile

        profile = UserProfile.objects.filter(user_id=obj.user_id).only("full_name").first()
        return profile.full_name if profile and profile.full_name else "Verified Buyer"

    def get_comments(self, obj):
        comments = obj.comments.select_related("parent").order_by("created_at")
        return ReviewCommentSerializer(comments, many=True).data


class WishlistItemSerializer(serializers.ModelSerializer):
    equipment_detail = EquipmentSerializer(source="equipment", read_only=True)

    class Meta:
        model = WishlistItem
        fields = ["id", "user_id", "equipment", "equipment_detail", "created_at"]
        read_only_fields = ["id", "user_id", "created_at"]


class CartItemSerializer(serializers.ModelSerializer):
    equipment_detail = EquipmentSerializer(source="equipment", read_only=True)
    subtotal = serializers.SerializerMethodField()

    class Meta:
        model = CartItem
        fields = [
            "id",
            "user_id",
            "equipment",
            "equipment_detail",
            "quantity",
            "start_date",
            "end_date",
            "subtotal",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "user_id", "created_at", "updated_at", "subtotal"]

    def get_subtotal(self, obj):
        days = (obj.end_date - obj.start_date).days + 1
        days = max(days, 0)
        return float(obj.equipment.price_per_day) * days * max(obj.quantity, 1)

    def validate(self, attrs):
        start_date = attrs.get("start_date", getattr(self.instance, "start_date", None))
        end_date = attrs.get("end_date", getattr(self.instance, "end_date", None))
        quantity = attrs.get("quantity", getattr(self.instance, "quantity", 1))
        if start_date and end_date and end_date < start_date:
            raise serializers.ValidationError({"end_date": "End date must be on or after start date."})
        if quantity is not None and int(quantity) < 1:
            raise serializers.ValidationError({"quantity": "Quantity must be at least 1."})
        return attrs
